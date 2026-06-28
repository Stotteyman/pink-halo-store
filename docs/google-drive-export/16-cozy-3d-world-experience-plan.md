# Pink Halo Cozy 3D World Experience Plan

Source Google Drive Doc: https://docs.google.com/document/d/1Z69s4GCPiGR-Ool97J1DWOLCffHOPJYrAeJtbIDsK6g

This file mirrors the Google Drive 3D shopping experience plan into GitHub.

## Purpose
Define the interactive Pink Halo shopping world experience.

## Experience Direction
The store should feel like a soft, cozy, feminine boutique world. The experience should be fun and immersive, but never make shopping harder.

## Core Features

- Three.js powered interactive boutique
- Separate walk-in department rooms with matching fixtures
- Product displays populated only from real published inventory
- Smooth transitions
- Mobile-friendly controls
- Standard shopping fallback
- Cart and checkout always accessible

## Design Rule
The 3D world should support sales, not distract from them. Customers must always be able to browse products normally.

## Current Implementation Decision

The store uses a central hall with five physical departments: Dresses, Tops, Lounge, Accessories, and Sale. Visitors walk through doors; there are no category altars, podiums, pedestals, or proximity-based category switches.

No production catalog database is connected, so all racks remain empty. Fullscreen is requested on entry. The front doors and settings menu share a confirmed quit flow that attempts to close the tab and falls back to an explicit visit-complete screen when browser security blocks closing.
