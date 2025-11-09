## Fresnel Zone Visualiser
**!! IF not working, please download it to your local PC and give it a try !!**

An interactive web-based tool for engineers to visualize and plan network links with real-time Fresnel zone calculations.

##  Features

- **Interactive Map Interface** - Click to place telecom towers on a Leaflet map
- **Real-time Elevation Data** - Automatic elevation fetching for accurate link planning
- **Link Creation** - Connect any two towers to create microwave links
- **Fresnel Zone Visualization** - Dynamic first Fresnel zone ellipse rendering
- **Frequency Control** - Adjust operating frequency (GHz) for each tower independently
- **Link Analytics** - View distance, elevation difference, and clearance data
- **Responsive Design** - Clean, intuitive UI with hover effects and tooltips

## What are Fresnel Zones?

Fresnel zones are ellipsoidal regions of space around the direct line-of-sight path between transmitter and receiver. For optimal microwave propagation, the first Fresnel zone should remain clear of obstacles. This tool calculates and visualizes these zones based on:
- Distance between towers
- Operating frequency
- Geographic coordinates

## Demo

[[Live Demo]](https://astrome-test-project-9wm9.vercel.app/)

## Technologies Used

- **Leaflet.js** - Interactive mapping
- **MapTiler** - Beautiful map tiles
- **Vanilla JavaScript** - Core functionality
- **CSS3** - Modern styling with animations

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fresnel-link-planner.git
cd fresnel-link-planner
```

2. Open `index.html` in your browser or serve with a local server:
```bash
python -m http.server 8000
# or
npx serve
```

3. Add your MapTiler API key in `map.js`:
```javascript
L.tileLayer("https://api.maptiler.com/maps/aquarelle/256/{z}/{x}/{y}.png?key=YOUR_KEY_HERE"
```

## Usage

1. **Add Towers**: Click anywhere on the map to place a telecom tower
2. **Set Frequency**: Adjust the frequency (GHz) for each tower using the +/- buttons
3. **Create Links**: Click a tower → "Connect" → Click another tower
4. **View Fresnel Zone**: Click a link → "Show Fresnel" to visualize the clearance zone
5. **Analyze**: Review distance, elevation changes, and frequency data
6. **Modify**: Delete towers or links as needed


## Technical Details

The Fresnel zone radius is calculated using:

```
R = √(λ × d₁ × d₂ / D)
```

Where:
- `R` = Fresnel zone radius at a point
- `λ` = Wavelength (c/f)
- `d₁` = Distance from transmitter to point
- `d₂` = Distance from point to receiver
- `D` = Total link distance

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own applications.

## Author

Built with ☕ by [Your Name]

## Acknowledgments

- MapTiler for beautiful map tiles
- Leaflet.js for the mapping library
- The telecommunications community for Fresnel zone theory
- Astrome for giving me this as an assignment

---

⭐ Star this repo if you find it helpful!
