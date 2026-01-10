import React, { useEffect } from 'react';

const AdSense = ({ slot, style, format = 'auto', responsive = 'true' }) => {
    const isPushed = React.useRef(false);

    useEffect(() => {
        if (isPushed.current) return;

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            isPushed.current = true;
        } catch (e) {
            console.error("AdSense error:", e);
        }
    }, []);

    return (

        <ins className="adsbygoogle"
            style={{ display: 'block', ...style }}
            data-ad-client="pub-5576980039510742"
            data-ad-slot="6716244638"
            data-ad-format={format}
            data-full-width-responsive={responsive}
        />
    );
};

export default AdSense;


