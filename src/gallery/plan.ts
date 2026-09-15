import { hangGallery } from "./hang.js";
import { routeThrough } from "./route.js";
import { ROOMS } from "./works.js";

/** The plan, made once from the data; the canvas draws it and the interface reads it. */
export const PLAN = hangGallery(ROOMS);

/** The tour's order, made once from the plan. */
export const ROUTE = routeThrough(PLAN);
