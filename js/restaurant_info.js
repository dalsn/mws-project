let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
 	initMap();
});

/**
 * Initialize leaflet map
 */
function initMap() {
 	fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
    	console.error(error);
      DBHelper.toast("Could not download content from remote server");
    } else {
    	self.newMap = L.map('map', {
    		center: [restaurant.latlng.lat, restaurant.latlng.lng],
    		zoom: 16,
    		scrollWheelZoom: false
    	});
    	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    		mapboxToken: 'pk.eyJ1IjoiZGFscyIsImEiOiJjamtzb2R0bGMyMDM0M290ZHlrZmRoeDV4In0.igOloQQbIH9Ma-iX395tLQ',
    		maxZoom: 18,
    		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
    		'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    		'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    		id: 'mapbox.streets'
    	}).addTo(newMap);
    	fillBreadcrumb();
    	DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.querySelector('.map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
function fetchRestaurantFromURL(callback) {
  // if (self.restaurant) {
  // 	callback(null, self.restaurant)
  // 	return;
  // }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
  	error = 'No restaurant id in URL'
  	callback(error, null);
  } else {
  	DBHelper.fetchRestaurantById(id, (error, restaurant) => {
  		self.restaurant = restaurant;
  		if (!restaurant) {
  			console.error(error);
        callback(error, null);
  			return;
  		}
  		fillRestaurantHTML();
  		callback(null, restaurant);
  	});
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
function fillRestaurantHTML(restaurant = self.restaurant) {
 	const name = document.querySelector('.restaurant-name');
 	name.innerHTML = restaurant.name;

 	const address = document.querySelector('.restaurant-address');
 	address.innerHTML = restaurant.address;

  const restaurantId = document.querySelector('#restaurant_id');
  restaurantId.value = restaurant.id;

 	const image = document.querySelector('.restaurant-img');
 	image.className = 'restaurant-img'
 	image.alt = `image of ${restaurant.name} restaurant`;
 	image.src = DBHelper.imageUrlForRestaurant(restaurant);

 	const cuisine = document.querySelector('.restaurant-cuisine');
 	cuisine.innerHTML = restaurant.cuisine_type;

  if (restaurant.is_favorite) {
    const fav = document.querySelector('.red-heart-checkbox');
    fav.checked = JSON.parse(restaurant.is_favorite);
  }

  // fill operating hours
  if (restaurant.operating_hours) {
  	fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
function fillRestaurantHoursHTML(operatingHours = self.restaurant.operating_hours) {
 	const hours = document.querySelector('.restaurant-hours');
 	for (let key in operatingHours) {
 		const row = document.createElement('tr');

 		const day = document.createElement('td');
 		day.innerHTML = key;
 		row.appendChild(day);

 		const time = document.createElement('td');
 		time.innerHTML = operatingHours[key];
 		row.appendChild(time);

 		hours.appendChild(row);
 	}
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
function fillReviewsHTML(reviews = self.restaurant.reviews) {
 	const container = document.querySelector('.reviews-container');
 	const title = document.createElement('h2');
 	title.innerHTML = 'Reviews';
 	container.appendChild(title);

 	if (!reviews) {
 		const noReviews = document.createElement('p');
 		noReviews.innerHTML = 'No reviews yet!';
 		container.appendChild(noReviews);
 		return;
 	}
 	const ul = document.querySelector('.reviews-list');
 	reviews.forEach(review => {
 		ul.appendChild(createReviewHTML(review));
 	});
 	container.appendChild(ul);
  showAddReviewHTML();
}

/**
 * Create review HTML and add it to the webpage.
 */
function createReviewHTML(review) {
 	const li = document.createElement('li');

 	const header = document.createElement('div');
 	header.className = 'review-header';
 	li.appendChild(header);

 	const name = document.createElement('span');
 	name.className = 'reviewer';
 	name.innerHTML = review.name;
 	header.appendChild(name);

 	const date = document.createElement('span');
 	date.className = 'review-date';
 	date.innerHTML = new Date(review.updatedAt).toDateString();
 	header.appendChild(date);

 	const body = document.createElement('div');
 	body.className = 'review-body';
 	li.appendChild(body);

 	const rating = document.createElement('span');
 	rating.className = 'review-rating';
 	rating.innerHTML = `Rating: ${review.rating}`;
 	body.appendChild(rating);

 	const comments = document.createElement('p');
 	comments.innerHTML = review.comments;
 	body.appendChild(comments);

 	return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
function fillBreadcrumb(restaurant=self.restaurant) {
 	const breadcrumb = document.querySelector('.breadcrumb');
 	const li = document.createElement('li');
 	li.innerHTML = restaurant.name;
 	breadcrumb.appendChild(li);
}

function showAddReviewHTML() {
  const form = document.querySelector('#addReview');
  form.className = "show";
}

/**
 * Get a parameter by name from page URL.
 */
function getParameterByName(name, url) {
 	if (!url)
 		url = window.location.href;
 	name = name.replace(/[\[\]]/g, '\\$&');
 	const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
 	results = regex.exec(url);
 	if (!results)
 		return null;
 	if (!results[2])
 		return '';
 	return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function favorite() {
  const id = document.querySelector('#restaurant_id').value;
  DBHelper.toggleFavorite(id)
    .then(() => {
      DBHelper.toast("Updated!");
    });
}

function clearForm() {
  document.querySelector('#name').value = "";
  document.querySelector('input[name=rating]:checked').checked = false;
  document.querySelector('#comments').value = "";
}

document.querySelector('.red-heart-checkbox').addEventListener('click', event => {
  favorite();
});

document.querySelector('#addReview').addEventListener('submit', event => {
  event.preventDefault();
  let name = document.querySelector('#name').value;
  let rating = document.querySelector('input[name=rating]:checked').value;
  let comments = document.querySelector('#comments').value;
  let restaurant_id = document.querySelector('#restaurant_id').value;

  let review = {
    'restaurant_id': parseInt(restaurant_id),
    name,
    rating,
    comments,
    'createdAt': new Date().getTime(),
    'updatedAt': new Date().getTime()
  }

  DBHelper.saveReview(review)
    .then(() => {
      fetchRestaurantFromURL((error, restaurant) => {
        if (error) {
          console.error(error);
        } else {
          DBHelper.toast('Added review successfully');
          clearForm();
        }
      });
    });
});