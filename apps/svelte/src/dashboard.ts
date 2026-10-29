import { mount } from "svelte";
import "./app.css";
import Dashboard from "./components/Dashboard.svelte";

mount(Dashboard, { target: document.getElementById("app")! });
