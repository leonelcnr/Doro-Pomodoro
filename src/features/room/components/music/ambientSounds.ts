import { Music, CloudRain, Flame, Waves, CloudLightning, Users, Car, Train, Keyboard, Bird, Activity, Droplets } from "lucide-react";

// Catálogo de sonidos ambientales. Los `id` y las rutas `archivo` deben coincidir
// con los archivos reales en /public/sounds, por eso se mantienen en inglés.
export const AMBIENT_SOUNDS = [
    { id: "rain", nombre: "Lluvia", icono: CloudRain, archivo: "/sounds/rain.ogg" },
    { id: "fire", nombre: "Fogata", icono: Flame, archivo: "/sounds/fire.ogg" },
    { id: "ocean", nombre: "Océano", icono: Waves, archivo: "/sounds/ocean.ogg" },
    { id: "thunder", nombre: "Truenos", icono: CloudLightning, archivo: "/sounds/thunder.ogg" },
    { id: "people", nombre: "Personas", icono: Users, archivo: "/sounds/people.ogg" },
    { id: "traffic", nombre: "Tráfico", icono: Car, archivo: "/sounds/traffic.ogg" },
    { id: "train", nombre: "Tren", icono: Train, archivo: "/sounds/train.ogg" },
    { id: "keyboard", nombre: "Teclado", icono: Keyboard, archivo: "/sounds/keyboard.ogg" },
    { id: "birds", nombre: "Pájaros", icono: Bird, archivo: "/sounds/birds.ogg" },
    { id: "brown_noise", nombre: "Ruido Marrón", icono: Activity, archivo: "/sounds/brown_noise.ogg" },
    { id: "jazz", nombre: "Jazz", icono: Music, archivo: "/sounds/jazz.ogg" },
    { id: "underwater", nombre: "Subacuático", icono: Droplets, archivo: "/sounds/white-noise-underwater.ogg" },
];
