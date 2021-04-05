
import './scss/layout.scss';
import './scss/style.scss';

ymaps.ready(init);
let myMap;
let 
  placemarks = [],
  geoObjects = [],
  centerOfMap = [],
  isBalloonIsBehindMap,
  isNewPlacemark = false,
  isOpenFromPlacemark = false;

const balloon = document.querySelector('#form'),
      closeBtn = balloon.querySelector('#close'),
      nameElement = balloon.querySelector('[data-role=review-name]'),
      placeElement = balloon.querySelector('[data-role=review-place]'),
      reviewElement = balloon.querySelector('[data-role=review-comment]'),
      listElement = document.querySelector('#review_list'),
      containerElement = document.querySelector('#form__container'),
      mapElement = document.querySelector("#map");

const storage = localStorage;
// storage.clear();

function init() {
  let address = '';

    myMap = new ymaps.Map('map', {
      center: [58.01, 56.23],
      zoom: 15,
      behaviors: ['drag'],
      controls: ['rulerControl', 'searchControl', 'zoomControl']
    }, {
      yandexMapDisablePoiInteractivity: true,
    });
      
  myMap.cursors.push('arrow');
  centerOfMap = [58.01, 56.23];
  const clusterer = initClusterer();

  if (storage.length > 0) {
    renderPlacemarks(clusterer);
  };
    
  myMap.events.add('click', e => {
    const coords = e.get('coords');
    const reviewForm = document.querySelector('[data-role=review-form]');
    reviewForm.dataset.coords = JSON.stringify(coords);
    
    isNewPlacemark = true;

    const myGeocoder = ymaps.geocode(coords);
    myGeocoder.then(
      function (res) {
      let firstGeoObject = res.geoObjects.get(0);
        
      address = firstGeoObject.properties.get('text');
      })
      .then(openBalloon(coords, 0));

  });

  document.body.addEventListener('click', e => {
    if (e.target.dataset.role === 'header') {
      e.preventDefault();

      const WIDTHOFARROW = 15; // половина длины стрелки
      const shiftX = e.clientX - e.target.getBoundingClientRect().x - WIDTHOFARROW;
      
      isNewPlacemark = false;
      const coords = getCoordsByAddress(e.target.textContent);
      
      openBalloon(coords, shiftX);
    }

    if (e.target.dataset.role === 'review-add') {
      e. preventDefault();

      addPlacemark();
    }
  })

  // function getAddress(coords) {
  //   ymaps.geocode(coords).then(function (res) {
  //   let firstGeoObject = res.geoObjects.get(0);

  //   address = firstGeoObject.properties.get('text');
  //   });
  // }

  function getCoordsByAddress(address) {
    const placemarks = loadReviewsFromStorage();
    let coords = [];

    for (let review of placemarks) {
        if (review.address === address) {
            coords = review.coords;
            break;
        }
    }
    return coords;
}

  function getAddressFromStorage(coords) {
    const placemarks = loadReviewsFromStorage();
    let addr = [];

    for (let review of placemarks) {
        if (JSON.stringify(review.coords) === JSON.stringify(coords)) {
            addr = review.address;
            break;
        }
    }
    return addr;
  }

  function getCurrentDate() {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();

    today = mm + '.' + dd + '.' + yyyy;
    return today;
  }

  function addPlacemark() {
    let myPlacemark = {};
    let coords = [];

    const reviewForm = document.querySelector('[data-role=review-form]');
    coords = JSON.parse(reviewForm.dataset.coords);
    
    myPlacemark.coords = coords;
    
    const curDate = getCurrentDate();
    myPlacemark.curDate = curDate;
    
    if (address === '') {address = getAddressFromStorage(coords)};
    myPlacemark.address = address;
    
    const name = nameElement.value.trim();
    const place = placeElement.value.trim();
    const comment = reviewElement.value.trim();

    if (name && place && comment) {
      myPlacemark.reviewer = name;
      myPlacemark.place = place;
      myPlacemark.comment = comment;

      
      if (coords && curDate && address) saveReviewsToStorage(myPlacemark);
      
      const geoObject = createGeoObject(myPlacemark);
      placemarks.push(myPlacemark);
      geoObjects.push(geoObject);
      
      clusterer.add(geoObject);
      myMap.geoObjects.add(clusterer);

      cleanForm();
      closeBalloon();
      
    } else alert('Заполните все поля!');
  }

  closeBtn.addEventListener('click', e => {
    cleanForm();
    closeBalloon();
  })
  
  function createGeoObject(placemark) {
    let {coords, date, address, reviewer, place, comment} = placemark;
    const geoObject = new ymaps.Placemark(coords, {
      hintContent: `<b>${reviewer}</b> ${place}`,
      balloonContentHeader: `${address}`,
      balloonContentBody: `<b>${reviewer}</b> [${place}]`,
      balloonContentFooter: comment
      }, {
        preset: 'islands#redIcon',
        iconColor: '#df6543',
        openBalloonOnClick: false
      }
    );

    addEvent(geoObject, placemark);
    
    return geoObject;
  }

  function addEvent(geoObject, placemark) {
    geoObject.events.add('click', (e) => {
      e.preventDefault();
      
      isNewPlacemark = false;
      isOpenFromPlacemark = true;
      
      openBalloon(placemark.coords);
    })
  }

  function initClusterer() {
    let customItemContentLayout = ymaps.templateLayoutFactory.createClass(
      '<a class=balloon__header data-role="header" id=header>{{ properties.balloonContentHeader|raw }}</a>'+
      '<div class=balloon__body>{{ properties.balloonContentBody|raw }}</div>' +
      '<div class=balloon__footer>{{ properties.balloonContentFooter|raw }}</div>'
    );

    return new ymaps.Clusterer({
      preset: 'islands#invertedRedClusterIcons',
      groupByCoordinates: false,
      openBalloonOnClick: true,
      clusterOpenBalloonOnClick: true,
      clusterBalloonContentLayout: 'cluster#balloonCarousel',
      clusterBalloonItemContentLayout: customItemContentLayout,
      clusterDisableClickZoom: true,
      clusterHideIconOnBalloonOpen: false,
      geoObjectHideIconOnBalloonOpen: false,
      clusterBalloonContentLayoutWidth: 200,
      clusterBalloonContentLayoutHeight: 130,
      clusterBalloonPagerSize: 5
    });
    
  }
  
  function renderPlacemarks(clusterer) {
    const placemarks = loadReviewsFromStorage();
    
    for (let mark of placemarks) {
      
      const geoObject = createGeoObject(mark);
      geoObjects.push(geoObject);
    }
    
    clusterer.add(geoObjects);
    myMap.geoObjects.add(clusterer);
  }

  const openBalloon = (coords, shiftX = 0) => {
    const reviewForm = document.querySelector('[data-role=review-form]');
    reviewForm.dataset.coords = JSON.stringify(coords);
    
    balloon.classList.remove('form--hidden');
    
    if (isNewPlacemark) {
      containerElement.style.display = 'none';
    } else {
      const clusterCloseBtn = document.querySelector(".ymaps-2-1-78-balloon__close");
      containerElement.style.display = 'block';
      if (clusterCloseBtn) {
        clusterCloseBtn.dispatchEvent(new MouseEvent('click'));
      };

      showAllReviews(coords);
    }
    
    const HEIGHTTRIANGLE = 20,
          WIDTHTRIANGLE = 20,
          TOPSHIFTHEADER = 15,
          LEFTSHIFTTRIANGLE = 50,
          TOPSHIFTBALLON = 85; //возникает из-за разницы координат при открытии из метки или кластера
    const x = event.clientX;
    const y = event.clientY;

    if (isOpenFromPlacemark) {
      balloon.style.top = (y - (balloon.offsetHeight / 2) - (HEIGHTTRIANGLE / 2)
                           + containerElement.offsetHeight - TOPSHIFTBALLON) + "px";
    } else {
      console.log(event.clientX);
      balloon.style.top = (y - (balloon.offsetHeight / 2) - (HEIGHTTRIANGLE / 2)
                         + containerElement.offsetHeight - TOPSHIFTHEADER) + "px";
    }
    balloon.style.left = (x + (balloon.offsetWidth / 2) - LEFTSHIFTTRIANGLE - WIDTHTRIANGLE) -shiftX + "px";
    
    const position = balloon.getBoundingClientRect();
    const windowWidth = document.documentElement.clientWidth;
    const windowHeight = document.documentElement.clientHeight;
    isBalloonIsBehindMap = ((position.x < 0) || (position.y < 0)) || (position.right > windowWidth);

    if (isBalloonIsBehindMap) {
      if (position.x < 0) {
        shiftCenterOfMap(-position.x, 0);
        balloon.style.left = `${position.width / 2}px`;
      } else if (position.right > windowWidth) {
        shiftCenterOfMap(position.right - windowWidth, 0);
        balloon.style.left = `${windowWidth - position.width / 2}px`;
      };
      if (position.y < 0) {
        shiftCenterOfMap(0, position.y);
        balloon.style.top = `${position.height / 2}px`;
      };
    };
  };

  function shiftCenterOfMap(shiftX, shiftY) {
    const [x, y] = myMap.getGlobalPixelCenter();

    centerOfMap = [x, y];
    myMap.setGlobalPixelCenter([ x + shiftX, y + shiftY ]);
  }

  const closeBalloon = () => {
    balloon.classList.add('form--hidden');
    listElement.innerHTML = '';
    isNewPlacemark = false;
    isOpenFromPlacemark = false;
    address = '';
    mapElement.style.overflow = "hidden";
  
    const reviewForm = document.querySelector('[data-role=review-form]');
    reviewForm.dataset.coords = JSON.stringify([]);

    if (isBalloonIsBehindMap) {myMap.setGlobalPixelCenter(centerOfMap)};
  }
}

function showAllReviews(coords) {
  const placemarksList = getAllReview(coords);
  const titleElement = document.querySelector('[data-role=review-address]');
  titleElement.textContent = placemarksList[0].address;
  const fragment = document.createDocumentFragment();

  placemarksList.forEach(elem => fragment.appendChild(renderReview(elem)));
  
  listElement.appendChild(fragment);
}

function getAllReview(coords) {
  const placemarks = loadReviewsFromStorage ();
  
  const filteringArray = placemarks.filter(
    elem => (JSON.stringify(elem.coords) === JSON.stringify(coords)));
  
  return filteringArray;
}

function renderReview(placemark) {
  
  const liElement = document.createElement('li');
  liElement.classList.add('review__item');

  const row = document.createElement('div');
  row.classList.add('review__row');

  const spanName = document.createElement('span');
  spanName.innerText = placemark.reviewer;
  spanName.classList.add('review__row--name');

  const spanPlace = document.createElement('span');
  spanPlace.innerText = placemark.place;
  spanPlace.classList.add('review__row--place');
  
  const spanDate = document.createElement('span');
  spanDate.innerText = placemark.curDate;
  spanDate.classList.add('review__row--date');

  const comment = document.createElement('div');
  comment.textContent = placemark.comment;
  comment.classList.add('review__row--comment');

  row.appendChild(spanName);
  row.appendChild(spanPlace);
  row.appendChild(spanDate);

  liElement.appendChild(row);
  liElement.appendChild(comment);

  return liElement;
}

const cleanForm = () => {
  nameElement.value = "";
  placeElement.value = "";
  reviewElement.value = "";
}

function saveReviewsToStorage (review) {
  let placemarks = loadReviewsFromStorage();
  placemarks.push(review);
  storage.setItem('data', JSON.stringify(placemarks));
}

function loadReviewsFromStorage () {
  return placemarks = JSON.parse(storage.getItem('data') || '[]');
}
