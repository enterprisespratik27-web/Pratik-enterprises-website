Pratik Enterprises website

Open index.html in your browser to view the website.

Backend mode:
- Run: npm start
- Open: http://localhost:3000
- Vendor login page: http://localhost:3000/vendor-login.html
- User login page: http://localhost:3000/user-login.html

Default vendor login:
- Username: pratik
- Password: pratik@123

Before real hosting, change the vendor password using environment variable:
- VENDOR_PASSWORD=your-strong-password

Pages:
- index.html: Home
- products.html: Products with photos and one fixed PDF catalogue
- about.html: About Us
- contact.html: Contact Us

Important setup:
1. Open script.js.
2. Replace phone number 919999999999 with your real WhatsApp number including country code.
3. Replace email and address with your real details.
4. To show your own single PDF to customers, replace this file:
   assets/pratik-enterprises-info.pdf

Products page:
- Click a product photo to view the full image.
- Products are fixed in products-data.js so they stay visible after deployment.
- To change products, update products-data.js and add product photos inside assets.

Note:
Public users cannot add or edit products from the website. Only the GitHub repo owner/collaborator can change products by updating files and pushing to GitHub.

With backend hosting, the vendor dashboard can add/delete products and save them in data/products.json.
GitHub Pages cannot run this backend. For backend deployment, use a Node hosting service such as Render, Railway, or a VPS.
