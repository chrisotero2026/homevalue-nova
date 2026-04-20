// DLCR CRM Integration - Sends form leads to dlcrcrm.com
// Uses capture phase so it fires BEFORE the existing SMS handler
// Does NOT call preventDefault - lets the existing SMS handler work normally
(function() {
  var CRM = 'https://dlcrcrm.com';

  function sendToCRM(endpoint, data) {
    try {
      fetch(CRM + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(function(e) { console.log('[CRM] error:', e); });
    } catch(e) { console.log('[CRM] error:', e); }
  }

  // Estimate form (f-est) - capture phase fires first
  var fEst = document.getElementById('f-est');
  if (fEst) {
    fEst.addEventListener('submit', function() {
      var fd = new FormData(fEst);
      var city = fd.get('city') || '';
      var zip = city.match(/\d{5}/);
      sendToCRM('/api/leads', {
        name: fd.get('name') || 'Unknown',
        phone: fd.get('phone') || '',
        address: fd.get('address') || '',
        zip: zip ? zip[0] : '',
        city: city,
        interest: 'seller',
        source: 'dlcrhv-estimate',
        page: window.location.pathname
      });
    }, true);
  }

  // List form (f-list) - capture phase
  var fList = document.getElementById('f-list');
  if (fList) {
    fList.addEventListener('submit', function() {
      var fd = new FormData(fList);
      var city = fd.get('city') || '';
      var zip = city.match(/\d{5}/);
      sendToCRM('/api/leads', {
        name: fd.get('name') || 'Unknown',
        phone: fd.get('phone') || '',
        zip: zip ? zip[0] : '',
        city: city,
        timeline: fd.get('timeline') || '',
        interest: 'seller',
        source: 'dlcrhv-listing',
        page: window.location.pathname
      });
    }, true);
  }

  // Buyer form (f-buy) if present
  var fBuy = document.getElementById('f-buy');
  if (fBuy) {
    fBuy.addEventListener('submit', function() {
      var fd = new FormData(fBuy);
      var city = fd.get('city') || '';
      var zip = city.match(/\d{5}/);
      sendToCRM('/api/buyer-leads', {
        name: fd.get('name') || 'Unknown',
        phone: fd.get('phone') || '',
        email: fd.get('email') || '',
        zip: zip ? zip[0] : '',
        city: city,
        interest: 'buyer',
        source: 'dlcrhv-buyer',
        page: window.location.pathname
      });
    }, true);
  }

  console.log('[DLCR CRM] Integration loaded - v1.0');
})();
