import { mount } from "svelte";
import "./app.css";
import OverlayB from "./components/OverlayB.svelte";

mount(OverlayB, { target: document.getElementById("app")! });
