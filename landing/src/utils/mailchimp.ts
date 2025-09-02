type MailchimpResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

const BASE = "https://lambdalearner.us9.list-manage.com/subscribe/post-json";
const QUERY = "u=ed343a6ec772e2e8ac2c1000a&id=e57eb935b1&f_id=002ec3e1f0";

export function subscribeEmail(email: string): Promise<MailchimpResult> {
  return new Promise((resolve) => {
    const cb = "mc_cb_" + Math.random().toString(36).slice(2);
    // Mailchimp needs c=<callback> param
    const src = `${BASE}?${QUERY}&c=${cb}&EMAIL=${encodeURIComponent(email)}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)[cb] = (resp: any) => {
      try {
        if (resp.result === "success") {
          resolve({ ok: true, message: resp.msg });
        } else {
          resolve({
            ok: false,
            message:
              (resp.msg as string)?.replace(/<[^>]+>/g, "") ||
              "Subscription failed",
          });
        }
      } finally {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any)[cb];
        script.remove();
      }
    };
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onerror = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any)[cb];
      script.remove();
      resolve({ ok: false, message: "Network error" });
    };
    document.head.appendChild(script);
  });
}
