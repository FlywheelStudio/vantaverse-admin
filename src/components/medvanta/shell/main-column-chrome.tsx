interface MainColumnChromeProps {
  children: React.ReactNode;
}

/** Cached `.main` scroll column wrapper; page content streams inside. */
export async function MainColumnChrome({
  children,
}: MainColumnChromeProps): Promise<React.ReactElement> {
  'use cache';

  return <div className="main">{children}</div>;
}
