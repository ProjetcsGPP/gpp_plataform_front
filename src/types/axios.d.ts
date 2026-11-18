import "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** Requests that must not be interpreted as an expired authenticated session. */
    gppAuthMode?: "public" | "authenticated";
    /** Overrides whether this request blocks the entire interface. Defaults to mutations only. */
    gppBlockUi?: boolean;
  }

  export interface InternalAxiosRequestConfig {
    gppAuthMode?: "public" | "authenticated";
    gppBlockUi?: boolean;
    /** Internal marker used to balance the shared network activity counter. */
    gppBlockUiTracked?: boolean;
  }
}
