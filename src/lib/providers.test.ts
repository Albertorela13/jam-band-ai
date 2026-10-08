import { afterEach, describe, expect, it, vi } from "vitest";
import { extractOpenAIOutputText, testConnection } from "@/lib/anthropic";
import { getActiveApiKey, getActiveModel, getSettings, saveSettings } from "@/lib/storage";

afterEach(() => {
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("provider settings", () => {
  it("keeps existing Anthropic settings usable when provider fields are absent", () => {
    window.localStorage.setItem(
      "askusers-data",
      JSON.stringify({ settings: { anthropic_api_key: "sk-ant-existing", model: "claude-opus-4-7" } }),
    );

    const settings = getSettings();
    expect(settings.provider).toBe("anthropic");
    expect(settings.anthropic_api_key).toBe("sk-ant-existing");
    expect(settings.model).toBe("claude-opus-4-7");
    expect(settings.openai_api_key).toBe("");
    expect(getActiveApiKey(settings)).toBe("sk-ant-existing");
  });

  it("persists separate credentials and models for the selected provider", () => {
    saveSettings({
      provider: "openai",
      anthropic_api_key: "sk-ant-keep",
      model: "claude-sonnet-4-6",
      openai_api_key: "sk-openai-selected",
      openai_model: "gpt-5.4-mini",
    });

    const settings = getSettings();
    expect(getActiveApiKey(settings)).toBe("sk-openai-selected");
    expect(getActiveModel(settings)).toBe("gpt-5.4-mini");
    expect(settings.anthropic_api_key).toBe("sk-ant-keep");
  });
});

describe("OpenAI Responses API", () => {
  it("extracts text from an output content block", () => {
    expect(
      extractOpenAIOutputText({ output: [{ content: [{ type: "output_text", text: "{\"ok\":true}" }] }] }),
    ).toBe("{\"ok\":true}");
  });

  it("uses a valid output-token minimum when testing an OpenAI connection", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ output_text: "ok" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await testConnection("openai", "sk-openai-test", "gpt-5-mini");

    const request = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(request.max_output_tokens).toBe(64);
  });
});
