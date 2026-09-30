# Library API Design: Books Resource

## Endpoints

* **List all books**
  * **Method:** `GET`
  * **Path:** `/books`
  * **Description:** Retrieves an array of all books in the library.
  * **Success Code:** `200 OK`

* **List books by author**
  * **Method:** `GET`
  * **Path:** `/books?author={authorName}`
  * **Description:** Retrieves an array of books filtered by the specified author query parameter.
  * **Success Code:** `200 OK`

* **Get a single book**
  * **Method:** `GET`
  * **Path:** `/books/{id}`
  * **Description:** Retrieves the details of a specific book by its ID.
  * **Success Code:** `200 OK`

* **Create a new book**
  * **Method:** `POST`
  * **Path:** `/books`
  * **Description:** Adds a new book to the library database.
  * **Example Request Body:**
    ```json
    {
      "title": "Dune",
      "author": "Frank Herbert",
      "year": 1965
    }
    ```
  * **Success Code:** `201 Created`

* **Update an existing book**
  * **Method:** `PUT`
  * **Path:** `/books/{id}`
  * **Description:** Replaces the data of an existing book by its ID.
  * **Example Request Body:**
    ```json
    {
      "title": "Dune (Special Edition)",
      "author": "Frank Herbert",
      "year": 1965
    }
    ```
  * **Success Code:** `200 OK`

* **Delete a book**
  * **Method:** `DELETE`
  * **Path:** `/books/{id}`
  * **Description:** Removes a book from the library database by its ID.
  * **Success Code:** `204 No Content`

## Error Codes

* **400 Bad Request**
  * **Example:** Happens when making a `POST /books` request to create a book, but the JSON payload is malformed or missing a required field like `"title"`.
* **404 Not Found**
  * **Example:** Happens when making a `GET /books/999` request to retrieve a book, but no book with the ID `999` exists in the database.
