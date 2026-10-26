import "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** Requests that must not be interpreted as an expired authenticated session. */
    gppAuthMode?: "public" | "authenticated";
  }

  export interface InternalAxiosRequestConfig {
    gppAuthMode?: "public" | "authenticated";
  }
}
