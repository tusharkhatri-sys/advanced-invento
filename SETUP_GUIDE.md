# Advanced Invento - Complete Setup Guide
# पूरा सेटअप गाइड (Step-by-Step)

---

## ✅ Step 1: Supabase Database Setup (One-Time)

1. Open your Supabase Dashboard:
   👉 https://supabase.com/dashboard/project/zarfdxqzwlurgeosafvv

2. Click **SQL Editor** in the left sidebar

3. Click **New Query**

4. Open the file: `supabase/schema.sql` from your project folder
   - Copy ALL the text from that file
   - Paste it in the SQL Editor

5. Click **Run** (▶️) — it will create all tables + add 20 sample products

6. Go to **Authentication → Users** → Click "Add User" → Create your owner account:
   - Email: `yourname@gmail.com`
   - Password: `any strong password`
   - ✅ Auto-confirm: YES

---

## ✅ Step 2: Run the App

Open a **Command Prompt / PowerShell** in the project folder and type:

```
npm run dev
```

Then open your browser and go to:
👉 **http://localhost:5173**

Login with the email + password you created in Step 1.

---

## ✅ Step 3: First Time Setup After Login

1. **Add Suppliers first** (Menu → Suppliers → Add Supplier)
   - Example: Shyam Electronics, 9876543210, Jodhpur

2. **Check Inventory** (Menu → Inventory)
   - 20 sample products are already loaded!
   - Add more products using the **+ Add Product** button

3. **Create your first Bill** (Menu → Billing / POS)
   - Search for a product → Add to cart → Generate Bill → Download PDF!

---

## 🚀 Deployment: Publish Online (Free)

### Option A: Vercel (Recommended — Free forever)

1. Go to https://vercel.com → Sign In with GitHub
2. Install the **Vercel CLI**:
   ```
   npm install -g vercel
   ```
3. In the project folder, run:
   ```
   vercel
   ```
4. Follow the prompts → Your app will be live at a `.vercel.app` URL!

### Option B: Netlify

1. Run: `npm run build`
2. Upload the `dist/` folder to https://app.netlify.com/drop

---

## 📱 Install as App on Android (PWA)

1. Open the app URL in **Chrome** on your Android phone
2. Tap the **3-dot menu** (⋮) in Chrome
3. Tap **"Add to Home Screen"** or **"Install App"**
4. Tap **Add** → App icon appears on your home screen!
5. You can now use it like a native Android app — even works offline!

---

## 📱 Install on iPhone (PWA)

1. Open the app URL in **Safari** on your iPhone
2. Tap the **Share** button (□↑) at the bottom
3. Tap **"Add to Home Screen"**
4. Tap **Add** → Done!

---

## 🔒 Security (Default Settings)

Your Supabase database uses **Row Level Security (RLS)**:
- Only logged-in users can see/edit data
- No public access allowed
- All data is encrypted in transit (HTTPS)

---

## 💡 Features Quick Reference

| What you want to do | Where |
|---|---|
| See today's sales + stock overview | Dashboard |
| Add/Edit products | Inventory → + Add Product |
| Scan barcode to find product | Inventory → camera icon |
| Create a customer bill | Billing / POS |
| Download GST invoice PDF | Billing → Generate Bill → PDF |
| Share bill on WhatsApp | Billing → Generate Bill → WhatsApp |
| Record a purchase from supplier | Purchases → + Add Purchase |
| See sales report with charts | Reports → Sales Report |
| Check which items are low | Dashboard → Low Stock Alert |
| Add a supplier | Suppliers → + Add Supplier |
| Switch Hindi/English | Header → Globe icon |
| Toggle dark/light mode | Header → Sun icon |

---

## 🔧 Troubleshooting

**Problem: Login not working**
→ Make sure you created a user in Supabase Auth (Step 1, point 6)
→ Enable "Email confirmations OFF" in Supabase Auth settings

**Problem: No products showing**
→ Make sure you ran the SQL script in Supabase SQL editor

**Problem: npm run dev not working**
→ Make sure Node.js is installed: https://nodejs.org (download LTS)
→ Run in the correct folder: `cd "advanced invento"`

**Problem: PDF not downloading**
→ Allow pop-ups in Chrome for localhost

---

## 📞 GST Reference (India)

| Category | HSN Code | GST Rate |
|---|---|---|
| Mobile Chargers | 8504 | 18% |
| Mobile Cases | 3926 | 12% |
| Screen Guards | 7007 | 18% |
| Earphones/Cables | 8518/8544 | 18% |
| Power Banks | 8507 | 18% |

**CGST + SGST** = Selling within Rajasthan (same state)
**IGST** = Selling to another state (toggle in billing)
