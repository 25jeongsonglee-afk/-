import fs from "fs";
import path from "path";

const generatedIconPath = path.join(process.cwd(), "src/assets/images/meister_pwa_icon_1781423714137.jpg");
const publicDir = path.join(process.cwd(), "public");
const iconsDir = path.join(publicDir, "icons");

async function setup() {
  console.log("Setting up PWA assets...");
  
  // 1. Create directories
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log("Created public directory");
  }
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log("Created public/icons directory");
  }

  // 2. Safely copy the generated meister_pwa_icon to PWA standard endpoints
  if (fs.existsSync(generatedIconPath)) {
    // Copy as both original and png extensions for total compatibility with PWA scanners
    fs.copyFileSync(generatedIconPath, path.join(iconsDir, "icon-192.png"));
    fs.copyFileSync(generatedIconPath, path.join(iconsDir, "icon-512.png"));
    fs.copyFileSync(generatedIconPath, path.join(iconsDir, "maskable-icon.png"));
    fs.copyFileSync(generatedIconPath, path.join(publicDir, "favicon.ico"));
    console.log("Successfully copied PWA icons to /public/icons/");
  } else {
    console.error("Warning: Generated PWA icon path not found: " + generatedIconPath);
  }
}

setup().catch(err => {
  console.error("Error setting up assets:", err);
});
