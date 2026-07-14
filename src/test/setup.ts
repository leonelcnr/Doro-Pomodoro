import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Sin `globals: true` en la config, Testing Library no registra su cleanup
// automático; lo hacemos explícito para desmontar los hooks entre tests.
afterEach(() => {
  cleanup();
});
