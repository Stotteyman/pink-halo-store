# PinkHalo.co Interactive Storefront Starter Notes

Source Google Drive Doc: https://docs.google.com/document/d/1vT-wFHy0v27eRq-NQXtCKF5sNopqa2RYl05BxOAeR50

This file mirrors the Google Drive interactive storefront planning document into GitHub.

## Purpose
Track the interactive storefront concept and starter implementation notes.

## Direction
PinkHalo.co should include a smooth interactive boutique experience that feels detailed, polished, feminine, and user-friendly.

## Technical Priorities

- Scene setup
- Physical room geometry and doorways
- Room-presence detection from camera position
- Database-driven product display rails that remain empty without published inventory
- Smooth transitions
- Mobile controls
- Product-card overlays
- Cart integration
- Standard ecommerce fallback
- Performance optimization
- Accessibility and simple navigation
- Fullscreen entry and confirmed physical/settings exit

## Rule
The interactive experience should enhance shopping while keeping checkout simple and reliable.

## Current Runtime Contract

`PinkHaloScene.tsx` owns the room geometry, first-person controller, room detection, display fixtures, and front-door exit trigger. `HomePage.tsx` owns fullscreen entry, HUD, settings, confirmation, and the browser-close fallback. Product samples are disabled until a real published catalog is connected.
