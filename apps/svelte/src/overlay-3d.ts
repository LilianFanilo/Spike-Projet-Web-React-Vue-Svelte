import { mount } from "svelte";
import "./app.css";
import Overlay3D from "./components/Overlay3D.svelte";

mount(Overlay3D, { target: document.getElementById("app")! });
