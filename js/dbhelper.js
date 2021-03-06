let dbPromise;
let webWorker;

/**
 * Check for service worker and register it
 */
if ('serviceWorker' in navigator) {

  navigator.serviceWorker
    .register('./sw.js', { scope: './' })
    .then((registration) => {
      console.log("Service worker now active");
    })
    .catch((err) => {
      console.error("Could not register Service Worker", err);
    });

    webWorker = new Worker('./js/worker.js');

    dbPromise = idb.open('restaurant', 1, upgradeDb => {
      let store = upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id'
      });
      store.createIndex('by-id', 'id');

      let store1 = upgradeDb.createObjectStore("reviews", {
        keyPath: 'id',
        autoIncrement: true
      });
      store1.createIndex("by-restaurant", "restaurant_id");

      let store2 = upgradeDb.createObjectStore("savedReviews", {
        keyPath: 'id',
        autoIncrement: true
      });
      store2.createIndex("by-id", "id");
      store2.createIndex("by-restaurant", "restaurant_id");

      let store3 = upgradeDb.createObjectStore("savedFavorites", {
        keyPath: 'restaurant_id'
      });
      store3.createIndex("by-restaurant", "restaurant_id");
    });
}

/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static DATABASE_URL(path) {
    // const port = 1337 // Change this to your server port
    // return `http://localhost:${port}/${path}`;
    return `https://dals-mws-server.herokuapp.com/${path}`;
  }

  static toast(message) {
    let toast = document.querySelector('#toast');
    toast.innerHTML = message;
    toast.className = "show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 4000);
  }

  static fetchRestaurantsFromDB() {
    if (!dbPromise) return null;

    return dbPromise.then((db) => {
      if (!db) return null;

      const tx = db.transaction('restaurants', 'readwrite');
      const index = tx.objectStore('restaurants').index('by-id');

      return index.getAll().then((response) => {
        if (!response)
          return null;
        return response;
      });
    });
  }

  /**
   * Fetch all restaurants from remote server.
   */
  static fetchRestaurantsFromServer(callback) {
    fetch(DBHelper.DATABASE_URL('restaurants'))
      .then(response => {
        return response.json();
      })
      .then(restaurants => {
        dbPromise.then(db => {
            if (!db) return;
            const tx1 = db.transaction('restaurants', 'readwrite');
            const store1 = tx1.objectStore('restaurants');
            restaurants.forEach((restaurant) => {
              store1.put(restaurant);
            })
        });
        callback(null, restaurants);
      })
      .catch(error => {
        callback(error, null);
      });
  }

  static saveReview(review) {
    return dbPromise
      .then((db) => {
        if (!db) return;
        const tx1 = db.transaction('savedReviews', 'readwrite');
        const store1 = tx1.objectStore('savedReviews');

        const tx = db.transaction('reviews', 'readwrite');
        const store = tx.objectStore('reviews');

        store1.add(review);
        store.add(review);

        return tx.complete && tx1.complete;
      });
  }

  static saveFavorite(data) {
    return dbPromise
      .then((db) => {
        if (!db) return;
        const tx1 = db.transaction('savedFavorites', 'readwrite');
        const store1 = tx1.objectStore('savedFavorites');

        store1.put(data);

        return tx1.complete;
      });
  }

  static fetchReviewsFromDB(id) {
    if (!dbPromise) return null;

    return dbPromise.then((db) => {
      if (!db) return null;

      const tx = db.transaction('reviews', 'readwrite');
      const index = tx.objectStore('reviews').index('by-restaurant');

      return index.getAll(id).then((response) => {
        if (!response)
          return null;
        return response;
      });
    });
  }

  static fetchReviewsFromServer(id) {
    return fetch(DBHelper.DATABASE_URL(`reviews/?restaurant_id=${id}`))
      .then(response => {
        return response.json();
      })
      .then(reviews => {
        dbPromise.then((db) => {
            if (!db) return;
            const tx1 = db.transaction('reviews', 'readwrite');
            const store1 = tx1.objectStore('reviews');
            reviews.forEach((review) => {
              store1.put(review);
            })
        });
        return reviews;
      })
      .catch(error => {
        console.error(error);
        return null;
      });
  }

  static fetchReviews(id) {
    return DBHelper.fetchReviewsFromDB(id)
      .then(reviews => {
        if (reviews.length > 0) {
          return reviews;
        } else {
          return DBHelper.fetchReviewsFromServer(id);
        }
      })
      .catch(e => {
        console.error(e);
        return DBHelper.fetchReviewsFromServer(id);
      });
  }

  static fetchReviewsByRestaurant(restaurant, callback) {
    DBHelper.fetchReviews(restaurant.id)
      .then(reviews => {
        if (reviews.length > 0) {
          // const restaurantReviews = reviews.filter(r => r.restaurant_id == restaurant.id);
          restaurant.reviews = reviews;
        }
        callback(null, restaurant);
      })
      .catch(error => {
        callback(error, null);
      })
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    DBHelper.fetchRestaurantsFromDB()
      .then(restaurants => {
        if (restaurants.length > 0) {
          callback(null, restaurants);
        } else {
          DBHelper.fetchRestaurantsFromServer(callback);
        }
      })
      .catch(e => {
        console.error(e);
        DBHelper.fetchRestaurantsFromServer(callback);
      })
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          DBHelper.fetchReviewsByRestaurant(restaurant, callback);
          // callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  static toggleFavorite(restaurant_id) {
    return DBHelper.fetchRestaurantsFromDB()
      .then((restaurants) => {
        if (restaurants) {
          const restaurant = restaurants.find(r => r.id == restaurant_id);
          if (restaurant) {
            if (!dbPromise) return null;

            return dbPromise.then((db) => {
              if (!db) return null;

              const tx = db.transaction('restaurants', 'readwrite');
              const store = tx.objectStore('restaurants');

              restaurant.is_favorite = !JSON.parse(restaurant.is_favorite);
              store.put(restaurant);

              return DBHelper.saveFavorite({
                'restaurant_id': restaurant.id,
                'is_favorite': restaurant.is_favorite
              });

            });
          }
        }
      })
      .catch(error => console.error(error));
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if (! restaurant.hasOwnProperty("photograph")) {
      restaurant.photograph = "10";
    }
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}

if (webWorker) {
  setTimeout(webWorker.postMessage("save"), 120 * 1000); //run web worker every 2 minutes
}

