# 🎬 Studio Portfolio Website

Simple HTML + CSS + JS portfolio — koi build step nahi, koi server nahi.

```
index.html        → main website
admin.html        → admin panel (photo upload / manage)
js/config.js      → ✏️ APNI DETAILS YAHAN (naam, phone, WhatsApp, social, showreel, password)
js/main.js        → website ka logic
js/admin.js       → admin panel ka logic
css/style.css     → design
data/gallery.json → portfolio items ki list (admin panel isse update karta hai)
images/           → upload ki hui photos yahan save hoti hain
```

## 1. Apni details daalo
`js/config.js` kholo aur brand name, email, phone, WhatsApp number, Instagram/YouTube link, showreel (YouTube link) badlo.
Text (About, Services, Testimonials, FAQ) seedha `index.html` me edit karo.
Hero / About ki photo badalni ho to `css/style.css` me `.hero-bg` ka URL aur `index.html` me about wali `<img>` badlo (apni photo `images/` me rakh ke `images/hero.jpg` likho).

## 2. GitHub pe daalo
1. https://github.com pe free account banao → **New repository** → naam e.g. `studio-portfolio` → **Public** → Create.
2. Is folder me terminal kholo:
```
git init
git add .
git commit -m "First version"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/studio-portfolio.git
git push -u origin main
```

## 3. Free me LIVE karo (koi bhi ek choose karo)

| Platform | Kaise | URL milega |
|---|---|---|
| **Vercel** (recommended) | vercel.com → GitHub se login → *Add New → Project* → repo choose → **Deploy** (Framework: *Other*) | `your-name.vercel.app` |
| **Netlify** | netlify.com → *Add new site → Import from Git* → repo → Deploy | `your-name.netlify.app` |
| **Cloudflare Pages** | dash.cloudflare.com → Workers & Pages → Pages → Connect to Git | `your-name.pages.dev` |
| **GitHub Pages** | Repo → Settings → Pages → Branch: `main` / root → Save | `username.github.io/studio-portfolio` |

Sab free hain, aur har `git push` (ya admin panel se upload) ke baad website **automatic update** ho jaati hai. Custom domain (e.g. `yourstudio.in`) bhi free me jod sakte ho.

## 4. Admin panel setup (ek baar)
Admin panel photos ko seedha aapke GitHub repo me save karta hai → Vercel/Netlify khud website update kar dete hain.

1. GitHub → profile photo → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
   - Repository access: **Only select repositories** → apna portfolio repo
   - Permissions → Repository → **Contents: Read and write**
   - Generate → token copy karo (`github_pat_...`)
2. `https://your-site.vercel.app/admin.html` kholo → password: **`admin123`**
3. **Settings** tab → username, repo name, branch `main`, token daalo → *Save & Test Connection* ✓
4. **Upload** tab → photos drag & drop → title/category set karo → **Upload All**. 1 minute me live! 🎉

Manage tab se title/category edit, order change, aur delete kar sakte ho. YouTube videos bhi add ho sakte hain.

### 🔐 Password zaroor badlo
Admin → Settings → *Password Badlo* → naya password → **Generate Hash** → hash ko `js/config.js` me `adminPasswordHash` me paste karo → git push.

> Note: Asli security GitHub token hai — token sirf aapke browser me save hota hai, website code me nahi. Bina token ke koi bhi kuch change nahi kar sakta, chahe admin page khol le. Public/shared computer pe kaam ke baad **Disconnect** daba dena.

## Local pe dekhna
`index.html` double-click karne se gallery load nahi hogi (browser security). VS Code me **Live Server** extension se kholo, ya:
```
npx serve .
```

## Features
Preloader · sticky glass navbar · Ken-Burns hero + parallax · showreel modal (YouTube) · services marquee · animated counters · filterable masonry gallery + Load More · lightbox (keyboard + swipe) · process steps · auto testimonial slider · FAQ · contact form → WhatsApp · floating WhatsApp button · back-to-top · custom cursor · scroll reveal animations · fully mobile responsive · SEO meta tags.
