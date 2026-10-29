import { mount } from "svelte";
import "./app.css";
import OverlayA from "./components/OverlayA.svelte";

mount(OverlayA, { target: document.getElementById("app")! });
