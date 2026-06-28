Use the uploaded PinkHalo.co logo as the primary brand identity inspiration. The brand aesthetic should feel:

feminine
luxurious
dreamy
celestial
modern
soft-glam
premium but approachable
emotionally comforting
elegant social-commerce inspired
high-end boutique mixed with Pinterest, SKIMS, Sephora, Glossier, and Victoria’s Secret aesthetics

The website is for women shoppers primarily, but sells:

women’s clothing
men’s clothing
children’s clothing
pet clothing/accessories
beauty products
home/lifestyle products
collectibles and trending items

The website should feel like an online luxury universe instead of just an ecommerce store.

TECH STACK

Use:

Next.js 15+
TypeScript
TailwindCSS
Framer Motion
GSAP
Lenis smooth scrolling
React Icons
ShadCN/UI
Zustand
Stripe
Supabase
Prisma ORM
PostgreSQL
Cloudinary
Vercel deployment

Install:

npm install framer-motion gsap lenis zustand lucide-react react-icons
npm install @supabase/supabase-js
npm install stripe
npm install @stripe/stripe-js
npm install prisma @prisma/client
npm install clsx tailwind-merge
npm install next-themes
npm install react-intersection-observer
npm install react-hot-toast
npm install swiper

Initialize:

npx shadcn-ui@latest init
npx prisma init
DESIGN SYSTEM

The UI must feel ethereal and emotionally immersive.

Use:

soft glow effects
translucent glassmorphism
elegant gradients
floating particles
sparkling animations
subtle motion everywhere
premium whitespace
layered depth
soft rounded corners
feminine typography
luxury hover interactions

Avoid:

harsh shadows
corporate layouts
sharp corners
boring ecommerce grids
flat design
overly masculine colors
COLOR PALETTE

Use this EXACT color palette consistently.

Primary Colors

Soft Halo Pink:

#FF5FA2

Rose Quartz:

#F8C8DC

Cloud White:

#FFF8FB

Champagne Gold:

#F4C27A

Blush Glow:

#FFD9E8

Deep Velvet:

#29111B

Moonlight Cream:

#FFF3EE
Gradients

Primary Hero Gradient:

background: linear-gradient(
135deg,
#fff8fb 0%,
#ffd9e8 35%,
#f8c8dc 65%,
#fff3ee 100%
);

Luxury CTA Gradient:

background: linear-gradient(
90deg,
#ff5fa2 0%,
#ff87b5 50%,
#f4c27a 100%
);

Dark Luxury Background:

background: linear-gradient(
180deg,
#12060D 0%,
#29111B 100%
);
TYPOGRAPHY

Use:

Headers

Font:

font-family: "Cormorant Garamond", serif;
Body

Font:

font-family: "Inter", sans-serif;
Accent Script

For luxury sections:

font-family: "Great Vibes", cursive;

Import fonts from Google Fonts.

GLOBAL WEBSITE FEEL

The entire site should feel alive.

Add:

floating sparkles
glowing mouse cursor effects
parallax motion
animated backgrounds
elegant fade transitions
soft loading animations
premium hover states
floating product cards
dreamy atmosphere

Everything should animate smoothly.

HOMEPAGE STRUCTURE
HERO SECTION

Full viewport cinematic hero.

Features:

giant soft glowing background
floating sparkles
animated halo rings
luxury female fashion imagery
floating glassmorphism cards
animated text reveal
immersive CTA buttons

Headline:

Enter Your Dream Wardrobe

Subheadline:

Luxury fashion, beauty, pets, and lifestyle curated for your world.

CTA Buttons:

Shop Women
Explore Collections

Add floating animated particles.

HERO ANIMATION EXAMPLE
<motion.div
initial={{ opacity: 0, y: 80 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 1.2, ease: "easeOut" }}
>
  <h1>Enter Your Dream Wardrobe</h1>
</motion.div>
FLOATING PARTICLE SYSTEM

Create reusable particle component.

const particles = Array.from({ length: 40 });

{particles.map((_, i) => (
  <motion.div
    key={i}
    className="absolute rounded-full bg-pink-200"
    animate={{
      y: [0, -30, 0],
      opacity: [0.3, 1, 0.3]
    }}
    transition={{
      duration: 4 + i % 5,
      repeat: Infinity
    }}
    style={{
      width: Math.random() * 6 + 2,
      height: Math.random() * 6 + 2,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`
    }}
  />
))}
NAVBAR

Sticky translucent navbar.

Features:

blur background
floating glow
animated underline hover
luxury mega menu
live cart preview
profile dropdown
wishlist
search modal

Navbar categories:

Women
Men
Kids
Pets
Beauty
Home
New Arrivals
Collections

Navbar should shrink elegantly on scroll.

PRODUCT CARDS

Cards should feel premium.

Features:

hover glow
floating lift effect
quick add to cart
wishlist heart animation
hover image swap
sparkle overlay
review stars
smooth scaling

Animation:

whileHover={{
  y: -10,
  scale: 1.02
}}
CATEGORY EXPERIENCE

Each category should have its own emotional identity.

Women

Elegant luxury pink aesthetic.

Men

Dark luxury with champagne accents.

Kids

Playful pastel glow.

Pets

Cute soft rounded playful UI.

PRODUCT PAGE

The product page should feel extremely immersive.

Include:

cinematic gallery
3D hover effects
zoom interaction
floating CTA
sticky purchase panel
animated reviews
outfit recommendations
“Complete the Look”
live inventory
social proof popups
SHOPPING EXPERIENCE

Implement:

AI-inspired smart recommendations
recently viewed
wishlist syncing
dynamic filtering
animated sorting
infinite scroll
save outfits
collections
CART EXPERIENCE

Cart should slide from the side.

Features:

glassmorphism
animated totals
free shipping progress bar
luxury checkout animations
recommended add-ons
CHECKOUT EXPERIENCE

Minimal and luxurious.

Features:

one-page checkout
Apple Pay
Google Pay
Stripe integration
floating progress indicators
secure payment visuals
trust badges
MICROINTERACTIONS

EVERYTHING should respond beautifully.

Examples:

Buttons
transition: all 0.35s ease;

Hover:

transform: translateY(-3px) scale(1.02);
box-shadow: 0 20px 40px rgba(255,95,162,0.25);
CUSTOM CURSOR

Create glowing cursor effect.

document.addEventListener("mousemove", (e) => {
  cursor.style.left = `${e.clientX}px`;
  cursor.style.top = `${e.clientY}px`;
});

Cursor should softly glow pink.

PAGE TRANSITIONS

Use Framer Motion page transitions.

<motion.div
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
transition={{ duration: 0.6 }}
>
LOADING SCREEN

Create luxury loading screen.

Features:

animated halo
sparkles
glowing logo
soft music-inspired pulse
elegant fade away
ADMIN PANEL

Create advanced admin dashboard.

Features:

inventory management
analytics
order management
customer management
AI product recommendations
sales graphs
abandoned cart recovery
coupon management
CMS editor

Use:

Recharts
ShadCN tables
Supabase auth
MOBILE UX

Mobile experience is critical.

Must include:

thumb-friendly design
floating mobile nav
swipe gestures
mobile-first animations
TikTok-style vertical shopping inspiration
smooth transitions
PERFORMANCE

Optimize heavily.

Use:

Next.js image optimization
lazy loading
dynamic imports
GPU accelerated animations
optimized particle rendering

Target:

90+ Lighthouse score
smooth 60fps animations
SEO

Implement:

structured metadata
OpenGraph
schema markup
dynamic product SEO
optimized alt tags
ACCESSIBILITY

Ensure:

WCAG compliance
keyboard navigation
reduced motion support
proper contrast
screen reader support
SPECIAL EFFECTS

Create:

animated starfields
glowing halos
floating ribbons
aurora gradients
magical hover trails
luxury shimmer effects
SHIMMER BUTTON EXAMPLE
.button-shimmer::before {
  content: "";
  position: absolute;
  top: 0;
  left: -120%;
  width: 120%;
  height: 100%;
  background: linear-gradient(
    120deg,
    transparent,
    rgba(255,255,255,0.5),
    transparent
  );
  transition: all 0.8s;
}

.button-shimmer:hover::before {
  left: 120%;
}
FILE STRUCTURE
/app
/components
/components/ui
/components/animations
/components/shop
/components/layout
/lib
/hooks
/store
/styles
/public
REQUIRED COMPONENTS

Create:

AnimatedHero
FloatingParticles
LuxuryNavbar
ProductCard
GlowButton
SparkleBackground
CartDrawer
AnimatedCategoryGrid
HaloLoader
LuxuryFooter
ReviewCarousel
WishlistSystem
SearchModal
AIRecommendations
FloatingPromoBanner
FINAL GOAL

The final result should feel like:

“a luxury celestial ecommerce universe designed for modern women”

NOT just a normal Shopify clone.

The experience should emotionally impress users within the first 3 seconds through motion, lighting, elegance, and immersive interactions.
# Current Experience Decision — June 28, 2026

PinkHalo.co is a first-person place, not a traditional scrolling homepage. The visitor enters fullscreen, walks a central hall, and physically crosses doorways into separate Dresses, Tops, Lounge, Accessories, and Sale rooms. Category altars, portals, podiums, and click-to-switch category objects are not part of the current direction.

Rooms contain fixtures, lighting, signage, and display systems. Merchandise may only appear when it comes from a real published inventory source. Because no production product database is connected, the customer-facing rooms must remain empty and must not expose sample, placeholder, or localStorage-only products.

The front doors are the physical exit. Reaching them presents a confirmation. The settings menu also provides Quit. Entry requests browser fullscreen from a user gesture. Confirmed quit attempts to close the tab, with an explicit fallback because browsers can block scripts from closing tabs they did not open.
