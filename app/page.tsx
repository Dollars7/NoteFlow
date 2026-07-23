import NoteFlowApp from "./noteflow-app";
import { requireChatGPTUser } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireChatGPTUser("/");

  return (
    <NoteFlowApp
      user={{
        displayName: user.displayName,
        email: user.email,
        isLocal: user.email === "local@noteflow.dev",
      }}
    />
  );
}
