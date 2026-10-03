import { useEffect, useState } from 'react';

/** True while the CSS media query matches, e.g. useMediaQuery('(min-width: 1024px)'). */
export default function useMediaQuery(query) {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

    useEffect(() => {
        const media = window.matchMedia(query);
        const update = () => setMatches(media.matches);
        update();
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, [query]);

    return matches;
}
