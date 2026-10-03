import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useOnChange } from './useUi';

/**
 * Opens a "create" dialog when the URL carries ?new=1 (quick actions & command palette),
 * then strips the flag so a refresh doesn't reopen it. Returns [open, setOpen, params].
 */
export function useNewParam() {
  const [params, setParams] = useSearchParams();
  const { pathname } = useLocation();
  // A page that is animating out must not consume the flag meant for the incoming page
  const [ownPath] = useState(pathname);
  const wantsNew = pathname === ownPath && params.get('new') === '1';
  const [open, setOpen] = useState(wantsNew);

  useOnChange(wantsNew, (now) => {
    if (now) setOpen(true);
  });

  useEffect(() => {
    if (!wantsNew) return;
    const next = new URLSearchParams(params);
    next.delete('new');
    setParams(next, { replace: true });
  }, [wantsNew, params, setParams]);

  return [open, setOpen, Object.fromEntries(params.entries())];
}

export default useNewParam;
