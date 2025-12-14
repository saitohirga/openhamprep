// Analytics and tracking scripts
// All tracking tools gracefully handle missing configuration
// Configure keys in config.js or set window.ANALYTICS_CONFIG before this script loads

(function() {
  // Get config (set by config.js or externally)
  var config = window.ANALYTICS_CONFIG || {};

  // Google Analytics (GA4)
  // https://analytics.google.com
  if (config.GA_MEASUREMENT_ID) {
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + config.GA_MEASUREMENT_ID;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', config.GA_MEASUREMENT_ID);
  }

  // Microsoft Clarity
  // https://clarity.microsoft.com
  if (config.CLARITY_PROJECT_ID) {
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", config.CLARITY_PROJECT_ID);
  }
})();
