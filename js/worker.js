importScripts('db.js');

const pushContent = (e) => {

  if (!navigator.onLine) return;

  dbPromise = idb.open('restaurant', 1);

  pushReviews(dbPromise);
  pushFavorites(dbPromise);

}

const pushReviews = (dbPromise) => {

  if (!dbPromise) return;

  dbPromise.then((db) => {
    if (!db) return null;

    let tx = db.transaction('savedReviews', 'readwrite');
    const index = tx.objectStore('savedReviews').index('by-id');

    index.getAll().then((reviews) => {
      if (reviews.length < 1)
        return null;
      reviews.forEach(review => {
        let data = {
          'restaurant_id': parseInt(review.restaurant_id),
          'comments': review.comments,
          'name': review.name,
          'rating': review.rating
        }

        fetch(DBHelper.DATABASE_URL('reviews'), {
          method: 'POST',
          body: JSON.stringify(data)
        })
          .then(response => {
            return response.json();
          })
          .then(r => {
            tx = db.transaction('savedReviews', 'readwrite');
            const store = tx.objectStore('savedReviews');
            store.delete(review.id);
          })
          .catch(error => console.error(error));
      });
    });
  });
}

const pushFavorites = (dbPromise) => {

  if (!dbPromise) return;

  dbPromise.then((db) => {
    if (!db) return null;

    let tx = db.transaction('savedFavorites', 'readwrite');
    const index = tx.objectStore('savedFavorites').index('by-restaurant');

    index.getAll().then((favorites) => {
      if (favorites.length < 1)
        return null;
      favorites.forEach(favorite => {
        const path = `restaurants/${favorite.restaurant_id}/?is_favorite=${JSON.parse(favorite.is_favorite)}`
        fetch(DBHelper.DATABASE_URL(path), {
          method: 'PUT'
        })
          .then(response => {
            return response.json();
          })
          .then(restaurant => {
            tx = db.transaction('savedFavorites', 'readwrite');
            const store = tx.objectStore('savedFavorites');
            store.delete(restaurant.id);
          })
          .catch(error => console.error(error));
      });
    });
  });
}

self.onmessage = pushContent();
