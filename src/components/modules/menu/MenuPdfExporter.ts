import { MenuItem } from '../../../types';

export function exportMenuToPdf(menuItems: MenuItem[], institutionName: string = 'FOODEXA Institution'): void {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('Please allow popups to export the Menu PDF report.');
    return;
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const totalItems = menuItems.length;
  const activeCount = menuItems.filter(i => i.isAvailable && i.status !== 'archived').length;
  const avgPrice = (menuItems.reduce((acc, i) => acc + i.price, 0) / (totalItems || 1)).toFixed(2);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>FOODEXA - Official Campus Menu Catalog Report</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 32px;
            color: #0f172a;
            background: #ffffff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #6366f1;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .logo {
            font-size: 24px;
            font-weight: 900;
            letter-spacing: -0.5px;
            color: #0f172a;
          }
          .logo span {
            color: #6366f1;
            font-size: 12px;
            background: #e0e7ff;
            padding: 4px 8px;
            border-radius: 6px;
            margin-left: 8px;
          }
          .meta {
            text-align: right;
            font-size: 12px;
            color: #64748b;
          }
          .summary-bar {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
          }
          .summary-item {
            text-align: center;
          }
          .summary-item .num {
            font-size: 20px;
            font-weight: 800;
            color: #1e293b;
          }
          .summary-item .label {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-bottom: 32px;
          }
          th {
            background: #0f172a;
            color: #ffffff;
            text-align: left;
            padding: 10px 12px;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          tr:nth-child(even) td {
            background: #f8fafc;
          }
          .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .badge-veg { background: #dcfce7; color: #15803d; }
          .badge-nonveg { background: #fee2e2; color: #b91c1c; }
          .badge-vegan { background: #e0e7ff; color: #4338ca; }
          .price {
            font-family: monospace;
            font-weight: 800;
            color: #0f172a;
          }
          .footer {
            margin-top: 40px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
            font-size: 11px;
            color: #94a3b8;
            display: flex;
            justify-content: space-between;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="background: #6366f1; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer;">
            Print / Save as PDF
          </button>
        </div>

        <div class="header">
          <div>
            <div class="logo">FOODEXA <span>CAMPUS MENU REPORT</span></div>
            <div style="font-size: 13px; font-weight: 600; color: #475569; margin-top: 4px;">
              ${institutionName}
            </div>
          </div>
          <div class="meta">
            <div>Generated: ${currentDate}</div>
            <div>Audited by FOODEXA LX AI</div>
          </div>
        </div>

        <div class="summary-bar">
          <div class="summary-item">
            <div class="num">${totalItems}</div>
            <div class="label">Total Menu Items</div>
          </div>
          <div class="summary-item">
            <div class="num">${activeCount}</div>
            <div class="label">Active in Canteen</div>
          </div>
          <div class="summary-item">
            <div class="num">$${avgPrice}</div>
            <div class="label">Avg Dish Price</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Food Item</th>
              <th>Category</th>
              <th>Type</th>
              <th>Vendor</th>
              <th>Prep Time</th>
              <th>Calories</th>
              <th>Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${menuItems.map(item => `
              <tr>
                <td>
                  <strong>${item.name}</strong>
                  <div style="font-size: 10px; color: #64748b;">${item.description.substring(0, 70)}...</div>
                </td>
                <td>${item.category}</td>
                <td>
                  <span class="badge ${item.isVegetarian ? 'badge-veg' : 'badge-nonveg'}">
                    ${item.dietaryType || (item.isVegetarian ? 'Veg' : 'Non-Veg')}
                  </span>
                </td>
                <td>${item.vendorName}</td>
                <td>${item.prepTimeMinutes || 10} mins</td>
                <td>${item.calories} kcal</td>
                <td class="price">$${item.price.toFixed(2)}</td>
                <td>
                  <span style="font-weight: 700; color: ${item.isAvailable ? '#16a34a' : '#dc2626'};">
                    ${(item.status || (item.isAvailable ? 'published' : 'out_of_stock')).toUpperCase()}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div>FOODEXA Operations & Food Safety Audit Log • Confidential Campus Data</div>
          <div>Page 1 of 1</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
