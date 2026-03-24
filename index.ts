import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { Type } from "@sinclair/typebox";
import { verimorPost, verimorGet } from "./src/client.js";

export default definePluginEntry({
  id: "verimor-sms",
  name: "Verimor SMS",
  description: "Verimor üzerinden SMS gönder ve yönet",

  register(api) {
    const cfg = api.config as {
      username: string;
      password: string;
      source_addr?: string;
    };

    // ─── TOOL 1: SMS Gönder ───────────────────────────────────────
    api.registerTool(
      {
        name: "verimor_send_sms",
        description:
          "Verimor API üzerinden bir veya birden fazla numaraya SMS gönderir.",
        parameters: Type.Object({
          dest: Type.String({
            description: "Alıcı numara(lar). Virgülle ayır: 905XXXXXXXXX,905XXXXXXXXX",
          }),
          msg: Type.String({ description: "Gönderilecek mesaj metni" }),
          source_addr: Type.Optional(Type.String({ description: "Gönderici başlığı" })),
          send_at: Type.Optional(Type.String({ description: "İleri tarihli gönderim: '2025-06-01 10:00:00'" })),
          is_commercial: Type.Optional(Type.Boolean({ description: "Ticari mesaj mı?" })),
        }),
        async execute(_id, params) {
          const result = await verimorPost("/v2/send.json", {
            username: cfg.username,
            password: cfg.password,
            source_addr: params.source_addr ?? cfg.source_addr,
            messages: [{ dest: params.dest, msg: params.msg }],
            send_at: params.send_at,
            is_commercial: params.is_commercial,
          });
          return {
            content: [{ type: "text", text: `Kampanya ID: ${result.trim()}` }],
          };
        },
      },
      { optional: true }, // yan etkili tool: kullanıcı allowlist'e eklemeli
    );

    // ─── TOOL 2: Bakiye Sorgula ────────────────────────────────────
    api.registerTool({
      name: "verimor_check_balance",
      description: "Verimor hesabındaki kalan SMS kredisini sorgular.",
      parameters: Type.Object({}),
      async execute(_id, _params) {
        const result = await verimorGet("/v2/balance", {
          username: cfg.username,
          password: cfg.password,
        });
        return {
          content: [{ type: "text", text: `Kalan kredi: ${result.trim()}` }],
        };
      },
    });

    // ─── TOOL 3: Gönderim Raporu ───────────────────────────────────
    api.registerTool({
      name: "verimor_get_report",
      description: "Kampanya ID'si ile SMS gönderim raporunu getirir.",
      parameters: Type.Object({
        campaign_id: Type.Number({ description: "API'den dönen kampanya ID'si" }),
      }),
      async execute(_id, params) {
        const result = await verimorGet("/v2/status", {
          username: cfg.username,
          password: cfg.password,
          id: String(params.campaign_id),
        });
        return { content: [{ type: "text", text: result }] };
      },
    });

    // ─── TOOL 4: Başlıkları Listele ────────────────────────────────
    api.registerTool({
      name: "verimor_list_headers",
      description: "Hesapta tanımlı SMS gönderici başlıklarını listeler.",
      parameters: Type.Object({}),
      async execute(_id, _params) {
        const result = await verimorGet("/v2/headers", {
          username: cfg.username,
          password: cfg.password,
        });
        return { content: [{ type: "text", text: result }] };
      },
    });

    // ─── TOOL 5: Kampanya İptal ────────────────────────────────────
    api.registerTool(
      {
        name: "verimor_cancel_campaign",
        description: "İleri tarihli planlanmış SMS kampanyasını iptal eder.",
        parameters: Type.Object({
          campaign_id: Type.String({ description: "İptal edilecek kampanya ID'si" }),
        }),
        async execute(_id, params) {
          const result = await verimorPost(`/v2/cancel/${params.campaign_id}`, {
            username: cfg.username,
            password: cfg.password,
          });
          return { content: [{ type: "text", text: result }] };
        },
      },
      { optional: true },
    );
  },
});