## Interactive Voronoi Generator
An interactive browser-based tool for exploring Voronoi diagrams and how they change when seeds move, their influence is modified, or their positions are iteratively relaxed.

Features:
# Basic
Place seeds and generate a standard Voronoi diagram based on the nearest-point rule.
# Dynamic
Drag seeds around and watch the Voronoi cells update in real time.
# Weighted
Adjust individual seed influence using additive or multiplicative weighting to change territory boundaries.
# Relax
Visualize Lloyd relaxation by repeatedly moving each seed toward the centroid of its Voronoi cell.
- Adjustable iterations
- Adjustable animation speed
- Pause and resume
- Reset to original seed positions

Built With
- HTML
- CSS
- Vanilla JavaScript
- HTML Canvas API
No external libraries required.

How It Works:
Each pixel is assigned to the seed with the smallest distance score. In Lloyd relaxation, the centroid of each Voronoi cell is calculated and its seed is moved toward that position. Repeating this process gradually produces a more evenly distributed arrangement.