import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { requireSuperAdmin, generatePassword } from "../_shared/admin.ts";
import { sendCredentialsEmail } from "../_shared/email.ts";

serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const auth = await requireSuperAdmin(req);
  if (!auth.ok) return auth.response;
  const { admin, user } = auth.context;

  const rollback = async (created: { userId?: string; institutionId?: string }) => {
    if (created.institutionId) {
      await admin.from("institutions").delete().eq("id", created.institutionId).then((r) => {
        if (r.error) console.error("[rollback] delete institution:", r.error.message);
      });
    }
    if (created.userId) {
      await admin.auth.admin.deleteUser(created.userId).then((r) => {
        if (r.error) console.error("[rollback] delete user:", r.error.message);
      });
    }
  };

  try {
    const body = await req.json();
    const requestId = (body?.request_id || "").trim();
    let institutionCode = (body?.institution_code || "").trim().toUpperCase();
    const generatedEmail = (body?.generated_email || "").trim().toLowerCase();
    const generatedPassword = (body?.generated_password || "").trim() || generatePassword();

    if (!requestId) {
      return jsonResponse({ error: "request_id is required." }, 400);
    }
    if (!institutionCode) {
      return jsonResponse({ error: "Institution code is required." }, 400);
    }

    // STEP 0: Load the request
    const { data: request, error: reqErr } = await admin
      .from("institution_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (reqErr || !request) {
      return jsonResponse({ error: reqErr?.message || "Institution request not found." }, 404);
    }

    const email = generatedEmail || request.institution_email;

    // Validate institution code uniqueness (in both requests and institutions)
    const [reqCode, instCode] = await Promise.all([
      admin
        .from("institution_requests")
        .select("id")
        .eq("institution_code", institutionCode)
        .neq("id", requestId)
        .maybeSingle(),
      admin
        .from("institutions")
        .select("id")
        .eq("institution_code", institutionCode)
        .maybeSingle(),
    ]);

    if (reqCode.data || instCode.data) {
      return jsonResponse(
        { error: `Institution code "${institutionCode}" is already in use.` },
        409
      );
    }

    // STEP 1: Check for existing auth user
    let emailAlreadyExisted = false;
    let authUserId: string | undefined;
    const { data: existingUser } = await admin.auth.admin.getUserByEmail(email);
    if (existingUser?.user?.id) {
      emailAlreadyExisted = true;
      authUserId = existingUser.user.id;
    }

    const created = { userId: undefined as string | undefined, institutionId: undefined as string | undefined };

    // STEP 2: Create Auth User (or reuse existing)
    if (!authUserId) {
      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: {
          role: "institution_admin",
          institution_name: request.institution_name,
        },
      });
      if (authError || !authData?.user) {
        return jsonResponse(
          { error: `Failed to create auth user: ${authError?.message || "No user returned"}` },
          500
        );
      }
      authUserId = authData.user.id;
      created.userId = authUserId;
    }

    const approvedAt = new Date().toISOString();

    // STEP 3: Insert record into public.institutions
    const institutionRecord = {
      name: request.institution_name,
      institution_type: request.role || "University",
      campus: request.campus || null,
      city: request.city || null,
      state: request.state || null,
      country: request.country || null,
      contact_person: request.contact_person || null,
      institution_email: email,
      role: request.role || null,
      institution_website: request.institution_website || null,
      student_population: parseInt(request.student_population || "0", 10) || 0,
      food_courts: typeof request.food_courts === "number" ? request.food_courts : parseInt(request.food_courts_count || "0", 10) || 0,
      vendors: typeof request.vendors === "number" ? request.vendors : parseInt(request.vendors_count || "0", 10) || 0,
      message: request.message || null,
      phone: request.phone_number || null,
      email,
      institution_code: institutionCode,
      generated_email: email,
      generated_password: generatedPassword,
      approved_by: user.id,
      approved_at: approvedAt,
      status: "active",
      plan: request.plan || "Basic",
    };

    const { data: instData, error: instErr } = await admin
      .from("institutions")
      .insert(institutionRecord)
      .select("id")
      .single();

    if (instErr || !instData?.id) {
      await rollback(created);
      if (instErr?.code === "23505") {
        return jsonResponse(
          { error: `Institution code "${institutionCode}" is already taken. Please use a different code.` },
          409
        );
      }
      return jsonResponse(
        { error: `Failed to create institution record: ${instErr?.message || "Unknown error"}` },
        500
      );
    }
    created.institutionId = instData.id;

    // STEP 4: Create public.profiles record with role institution_admin
    const profileRecord = {
      user_id: authUserId,
      role: "institution_admin",
      institution_id: instData.id,
      full_name: request.contact_person || null,
      email,
    };

    let profileError: { message: string } | null = null;
    if (emailAlreadyExisted) {
      const { error } = await admin
        .from("profiles")
        .update({ institution_id: instData.id, role: "institution_admin", full_name: request.contact_person || null, email })
        .eq("user_id", authUserId);
      profileError = error;
    } else {
      const { error } = await admin.from("profiles").insert(profileRecord);
      profileError = error;
    }

    if (profileError) {
      await rollback(created);
      return jsonResponse(
        { error: `Failed to create user profile: ${profileError.message}` },
        500
      );
    }

    // STEP 5: Update institution_requests — save code, email, password, status → approved
    const { error: updateReqError } = await admin
      .from("institution_requests")
      .update({
        status: "approved",
        institution_code: institutionCode,
        generated_email: email,
        generated_password: generatedPassword,
        approved_at: approvedAt,
        approved_by: user.id,
      })
      .eq("id", requestId);

    if (updateReqError) {
      await rollback(created);
      return jsonResponse(
        { error: `Failed to mark request as approved: ${updateReqError.message}` },
        500
      );
    }

    // STEP 6: Create notification for the institution
    try {
      await admin.from("notifications").insert({
        institution_id: instData.id,
        user_id: authUserId,
        type: "success",
        title: "Institution Approved",
        message: "Your institution has been approved.",
        read: false,
      });
    } catch (err) {
      console.error("[approve] notification insert failed:", err);
    }

    // Audit log
    try {
      await admin.from("audit_logs").insert({
        user_id: user.id,
        user_name: user.email || "Super Admin",
        action: "Institution Approved",
        target: request.institution_name,
        target_id: requestId,
        details: `Code: ${institutionCode}`,
        ip_address: "edge-function",
      });
    } catch (err) {
      console.error("[approve] audit log insert failed:", err);
    }

    // STEP 7: Send credentials via email (non-blocking — approval already succeeded)
    const emailResult = await sendCredentialsEmail({
      institution_name: request.institution_name,
      institution_email: email,
      institution_code: institutionCode,
      login_email: email,
      password: generatedPassword,
      portal_url: "https://foodexa-institution-platform.vercel.app",
      contact_person: request.contact_person,
      first_login_instructions: "Please log in using the credentials above. You will be prompted to change your password on first login.",
      password_change_reminder: "For security, please change your generated password after your first login.",
    });

    return jsonResponse({
      success: true,
      institution_name: request.institution_name,
      institution_code: institutionCode,
      generated_email: email,
      generated_password: generatedPassword,
      approved_at: approvedAt,
      email_already_existed: emailAlreadyExisted,
      email_sent: emailResult.sent,
      email_error: emailResult.error || null,
    });
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Approval failed." },
      500
    );
  }
});
