import './scss/layout.scss';
import './scss/style.scss';

ymaps.ready(init);

let 
  placemarks = [],
  geoObjects = [],
  isNewPlacemark = false;

const balloon = document.querySelector('#form'),
      addBtn = balloon.querySelector('#add'),
      closeBtn = balloon.querySelector('#close'),
      nameElement = balloon.querySelector('#name'),
      placeElement = balloon.querySelector('#place'),
      reviewElement = balloon.querySelector('#review'),
      emptyMessageElement = document.querySelector('#empty_message'),
      listElement = document.querySelector('#review_list');

const storage = localStorage;
let counter = storage.length;

function init() {
  let myPlacemark = {},
      coords = [],
      address = '',
      myMap = new ymaps.Map('map', {
        center: [58.01, 56.23],
        zoom: 15,
        behaviors: ['drag']
      });
  
  myMap.cursors.push('arrow');

  const clusterer = initClusterer();

  loadReviewsFromStorage();

  if (placemarks) renderPlacemarks(myMap, clusterer);
  
  myMap.events.add('click', e => {
    coords = e.get('coords');
    myPlacemark.latitude = coords[0];
    myPlacemark.longitude = coords[1];
    isNewPlacemark = true;

    openBalloon(myPlacemark);
    getAddress(coords);
  });

  document.body.addEventListener('click', e => {
    e.preventDefault();

    if (e.target.tagName === 'A') {
      isNewPlacemark = false;
      openBalloon({}, e.target.textContent);
    }
  })

  function getAddress(coords) {
    ymaps.geocode(coords).then(function (res) {
    let firstGeoObject = res.geoObjects.get(0);

    myPlacemark.address = firstGeoObject.properties.get('text');
    });
  }

  function getCoordsByAddress(address) {
    for (let review of placemarks) {
        if (review.address === address) {
            coords = [review.latitude, review.longitude];
            break;
        }
    }
    console.log(coords);
}

  addBtn.addEventListener('click', e => {
    e.preventDefault();
    
    const name = nameElement.value.trim();
    const place = placeElement.value.trim();
    const comment = reviewElement.value.trim();
    
    if (name && place && review) {
      myPlacemark.reviewer = name;
      myPlacemark.place = place;
      myPlacemark.comment = comment;

      if (!isNewPlacemark) {
        myPlacemark.latitude = coords[0];
        myPlacemark.longitude = coords[1];
        if (!myPlacemark.address) myPlacemark.address = address;
      };
      console.log(myPlacemark);
      
      if (!myPlacemark.longitude) {console.log (myPlacemark)};
      saveReviewsToStorage(myPlacemark);
      
      const geoObject = createGeoObject(myPlacemark);
      placemarks.push(myPlacemark);
      geoObjects.push(geoObject);
      
      clusterer.add(geoObject);
      myMap.geoObjects.add(clusterer);

      cleanForm();
      closeBalloon();
      myPlacemark = {};
      
    } else alert('Заполните все поля!');
  })

  closeBtn.addEventListener('click', e => {
    cleanForm();
    closeBalloon();
  })
  
  function createGeoObject(placemark) {
    let {latitude, longitude, address, reviewer, place, comment} = placemark;
    const geoObject = new ymaps.Placemark([latitude, longitude], {
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
      coords.push(placemark.latitude);
      coords.push(placemark.longitude);
      
      isNewPlacemark = false;
      openBalloon(placemark);
    })
  }

  function initClusterer() {
    let customItemContentLayout = ymaps.templateLayoutFactory.createClass(
      '<a class=balloon__header id=header>{{ properties.balloonContentHeader|raw }}</a>'+
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
  
  function renderPlacemarks(map, clusterer) {
    
    console.log(placemarks);
    for (let mark of placemarks) {
      
      const geoObject = createGeoObject(mark);
      geoObjects.push(geoObject);
    }
    console.log(geoObjects);
    clusterer.add(geoObjects);
    map.geoObjects.add(clusterer);
  }

  const openBalloon = (placemark, addr) => {
    balloon.style.top = event.clientY + "px";
    balloon.style.left = event.clientX + "px";
    balloon.classList.remove('form--hidden');
    
    
    if (isNewPlacemark) {
      createGeoObject(placemark);
    } else {
      const clusterCloseBtn = document.querySelector(".ymaps-2-1-78-balloon__close");
      if (clusterCloseBtn) {
        clusterCloseBtn.dispatchEvent(new MouseEvent('click'));
      };

      emptyMessageElement.style.display = 'none';
      address = placemark.address||addr;
      showAllReviews(address);
    }
  };
}

function showAllReviews(addr) {
  const placemarksList = getAllReview(addr);
  const fragment = document.createDocumentFragment();

  placemarksList.forEach(elem => fragment.appendChild(renderReview(elem)));
  
  listElement.appendChild(fragment);
}

function getAllReview(addr) {
  
  const filteringArray = placemarks.filter(
    elem => (elem.address === addr));
  
  return filteringArray;
}

function renderReview(placemark) {
  
  const liElement = document.createElement('li');
  liElement.classList.add('review__item');

  const spanName = document.createElement('span');
  spanName.innerText = placemark.reviewer;
  spanName.classList.add('review__item--name');

  const spanPlace = document.createElement('span');
  spanPlace.innerText = `[${placemark.place}]`;
  spanPlace.classList.add('review__item-place');

  const comment = document.createElement('div');
  comment.textContent = placemark.comment;
  comment.classList.add('review__item-comment');

  liElement.appendChild(spanName);
  liElement.appendChild(spanPlace);
  liElement.appendChild(comment);

  return liElement;
}

const cleanForm = () => {
  nameElement.value = "";
  placeElement.value = "";
  reviewElement.value = "";
}

const closeBalloon = () => {
  balloon.classList.add('form--hidden');
  listElement.innerHTML = '';
  isNewPlacemark = false;
  emptyMessageElement.style.display = 'block';
}

function saveReviewsToStorage (review) {
  storage.setItem(counter, JSON.stringify(review));
  counter++;
}

function loadReviewsFromStorage () {
  
  for (let i = 0; i < storage.length; i++) {
    const placemark = JSON.parse(localStorage.getItem(i));
    placemarks.push(placemark);
  }
  console.log(placemarks);
}
