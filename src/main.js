ymaps.ready(init);

let placemarks = [
  {
    latitude: 58.01,
    longitude: 56.23,
    hintContent: '<div class="map__hint">ул. Ленина, д.14, с.1</div>',
    balloonContent: [
      '<div class="map__balloon">',
      'Самые вкусные бургеры у нас! Заходите по адресу: ул. Борцов Революции, д. 122',
      '<img class="map__burger-img" src="img/burger.png" alt="Бургер"/>',
      '</div>'
    ]
  }
],
  geoObjects = [];

const balloon = document.querySelector('#form'),
      add = balloon.querySelector('#add');


function init() {
  let map = new ymaps.Map('map', {
    center: [58.01, 56.23],
    zoom: 12,
    // controls: ['zoomControl'],
    behaviors: ['drag']
  });

  geoObjects[0] = new ymaps.Placemark([placemarks[0].latitude, placemarks[0].longitude],
    {
      hintContent: placemarks[0].hintContent,
      balloonContent: placemarks[0].balloonContent.join('')
    },
    {
      iconLayout: 'default#image',
      iconImageHref: 'img/map-marker.png',
      iconImageSize: [40, 40],
      iconImageOffset: [-20, -20]
    });

  map.geoObjects.add(geoObjects[0]);

  map.events.add('click', e => {
    let coords = e.get('coords');
    console.log(coords.join(', '));
    form.classList.remove('map__balloon--hidden');

    add.addEventListener('click', e => {
      e.preventDefault();


    })
  })
}

