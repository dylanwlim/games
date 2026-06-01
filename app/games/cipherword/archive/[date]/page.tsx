import { redirect } from "next/navigation";

type CipherwordArchiveDatePageProps = {
  params: Promise<{
    date: string;
  }>;
};

export default async function CipherwordArchiveDatePage({
  params,
}: CipherwordArchiveDatePageProps) {
  const { date } = await params;

  redirect(`/games/cipherword?mode=archive&date=${date}`);
}
