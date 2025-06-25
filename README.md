# Online Shop

## Overview
This project is an online shop that allows users to browse and purchase products. It includes an admin section for managing products and user authentication via Google.

## Project Structure
```
online-shop
├── index.html          # Main page of the online shop
├── css
│   └── styles.css     # Styles for the online shop
├── js
│   ├── main.js        # Main JavaScript file for the shop
│   ├── auth.js        # User authentication management
│   ├── products.js     # Fetching and displaying products
│   └── admin.js       # Admin functions for managing products
├── admin
│   ├── index.html     # Admin main page
│   └── add-product.html # Form for adding new products
├── assets
│   └── images         # Directory for images used in the shop
├── data
│   └── products.json   # JSON file containing product data
├── .github
│   └── workflows
│       └── deploy.yml  # GitHub Actions workflow for deployment
└── README.md          # Documentation for the project
```

## Features
- User authentication via Google
- Product listing displayed in a grid format
- Admin section for adding, editing, and deleting products
- Responsive design for mobile and desktop views

## Setup Instructions
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/online-shop.git
   ```
2. Navigate to the project directory:
   ```
   cd online-shop
   ```
3. Open `index.html` in your web browser to view the online shop.

## Usage
- Users can browse products and log in using Google.
- Admins can manage products through the admin section.

## Deployment
This project is set up to be deployed on GitHub Pages using GitHub Actions. The deployment configuration can be found in `.github/workflows/deploy.yml`.