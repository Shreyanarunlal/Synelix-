// src/context/authShared.js
// The context object and role map live apart from the provider component so
// the provider module exports components only, which is what React Fast
// Refresh needs to hot-reload it reliably.

import { createContext } from "react";

export const AuthContext = createContext(null);

/** Where each role lands after signing in. */
export const ROLE_HOME = {
  STUDENT: "/student",
  COMPANY: "/company",
  INSTITUTION: "/institution",
};
