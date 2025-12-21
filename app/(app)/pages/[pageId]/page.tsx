import PageEditorClient from "@/src/components/editor/PageEditorClient";

export default async function PageEditorPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  return <PageEditorClient pageId={pageId} />;
}
