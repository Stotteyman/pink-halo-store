# Pink Halo Immersive Storefront Contract

Updated: 2026-06-28

## Experience model

Pink Halo is a full-viewport first-person boutique. The entrance is not a hero section above a product grid, and normal page scrolling is disabled during the store experience.

The visitor walks through a central hall and enters departments by crossing physical doorways. Departments are complete rooms with distinct floors, walls, lighting, signs, and display fixtures:

- The Dress Room
- The Tops Room
- The Lounge
- The Accessories Room
- The Archive / Sale

Category-changing altars, podiums, pedestals, portals, and proximity buttons are prohibited. Room identity comes from the visitor's physical location.

## Inventory truth

The customer storefront must show only real, published products returned by the production catalog database. Sample data, localStorage drafts, fake prices, placeholder garments, and fabricated stock are prohibited.

At present, no production product database is connected. Therefore:

- all department fixtures remain empty;
- no product can be added to the bag;
- empty rooms explain that the collection is in preparation;
- future product records render only in the room matching their published category.

## Controls and viewport

- Enter Store requests fullscreen as part of the visitor's click.
- Desktop uses pointer-lock mouse look plus WASD or arrow movement.
- Touch devices use drag-to-look and on-screen directional controls.
- Esc releases pointer lock; Menu pauses the scene and exposes settings.
- The app remains usable if the browser denies fullscreen.

## Exit contract

The front doors are a physical exit trigger. When the visitor reaches them, the interface asks for confirmation. Menu also includes Quit Pink Halo.

After confirmation, the app exits fullscreen and calls `window.close()`. Browser security only guarantees script closing for script-opened tabs. If closure is blocked, the store replaces the experience with a visit-complete screen instructing the visitor to close the tab manually.

## Data contract for future merchandise

A future catalog integration must return published records with stable product ID, category, name, description, price, image/model asset, stock, and active status. The scene must not infer availability. Server-side inventory and checkout remain the source of truth.
