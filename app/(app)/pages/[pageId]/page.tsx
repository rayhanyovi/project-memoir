import PageEditorClient from "@/src/components/editor/PageEditorClient";

export default function PageEditorPage({
  params,
}: {
  params: { pageId: string };
}) {
  return <PageEditorClient pageId={params.pageId} />;
}
