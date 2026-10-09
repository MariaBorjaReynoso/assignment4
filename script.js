/*
  Name: Maria Reynoso
  Date: 10.09.2026
  CSC 372-01

  This is the script.js file it fetches show data
  from the TVmaze API, displays matching shows as cards, and fetches
  cast information for each show.
*/

const SEARCH_URL = "https://api.tvmaze.com/search/shows?q=";
const CAST_URL = "https://api.tvmaze.com/shows/";
const DEFAULT_QUERY = "friends";

// Grab elements once
const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const gallery = document.getElementById("gallery");
const statusMessage = document.getElementById("status-message");

/**
 * Strip HTML tags from a string so we can insert it as plain text.
 * @param {string} html - A string that may contain HTML.
 * @return {string} The string with HTML tags removed.
 */
function stripHtml(html) {
  if (!html) {
    return "";
  }
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
}

/**
 * Show a status message to the user.
 * @param {string} message - The message to display.
 */
function setStatus(message) {
  statusMessage.textContent = message;
}

/**
 * Clear the gallery container.
 */
function clearGallery() {
  gallery.innerHTML = "";
}

/**
 * Create a single show card element.
 * @param {object} show: A show object from the TVmaze search response.
 * @param {string[]} castNames: An array of cast member names.
 * @return {HTMLElement} The completed card element.
 */
function createShowCard(show, castNames) {
  const card = document.createElement("article");
  card.className = "show-card";

  // Poster (optional)
  if (show.image && show.image.medium) {
    const img = document.createElement("img");
    img.src = show.image.medium;
    img.alt = "Poster for " + show.name;
    card.appendChild(img);
  }

  // Name
  const name = document.createElement("h2");
  name.textContent = show.name || "Not available";
  card.appendChild(name);

  // Summary
  const summary = document.createElement("p");
  summary.textContent = stripHtml(show.summary) || "Not available";
  card.appendChild(summary);

  // Premiere date
  const premiere = document.createElement("p");
  premiere.textContent = "Premiered: " + (show.premiered || "Not available");
  card.appendChild(premiere);

  // Last updated
  const updated = document.createElement("p");
  updated.textContent = "Last updated: " + (show.updated || "Not available");
  card.appendChild(updated);

  // Genres
  const genres = document.createElement("p");
  genres.textContent =
    "Genres: " + (show.genres && show.genres.length ? show.genres.join(", ") : "Not available");
  card.appendChild(genres);

  // Rating
  const rating = document.createElement("p");
  rating.textContent =
    "Rating: " + (show.rating && show.rating.average ? show.rating.average : "Not available");
  card.appendChild(rating);

  // Cast
  const cast = document.createElement("p");
  cast.textContent =
    "Cast: " + (castNames.length ? castNames.join(", ") : "Not available");
  card.appendChild(cast);

  // Link
  const link = document.createElement("a");
  link.href = show.url;
  link.textContent = "View on TVmaze";
  link.target = "_blank";
  link.rel = "noopener";
  card.appendChild(link);

  return card;
}

/**
 * Fetch the main cast for a single show.
 * @param {number} showId: The TVmaze show ID.
 * @return {Promise<string[]>} A promise resolving to an array of cast names.
 */
async function fetchCast(showId) {
  try {
    const response = await fetch(CAST_URL + showId + "/cast");
    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }
    const castData = await response.json();
    // Return up to 4 cast names
    return castData.slice(0, 4).map(function (entry) {
      return entry.person.name;
    });
  } catch (error) {
    console.error("Could not load cast for show " + showId + ":", error);
    return [];
  }
}

/**
 * Fetch shows matching a query and display them.
 * @param {string} query: It is the search text entered by the user.
 */
async function searchShows(query) {
  clearGallery();

  if (!query.trim()) {
    setStatus("Please enter a search term.");
    return;
  }

  setStatus("Loading...");

  try {
    const response = await fetch(SEARCH_URL + encodeURIComponent(query));
    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    const results = await response.json();

    if (!results.length) {
      setStatus("No shows found for \"" + query + "\".");
      return;
    }

    // Limit to 10 results
    const topResults = results.slice(0, 10);

    // Fetch cast for each show in parallel
    const castPromises = topResults.map(function (result) {
      return fetchCast(result.show.id);
    });
    const allCast = await Promise.all(castPromises);

    // Build the cards
    topResults.forEach(function (result, index) {
      const card = createShowCard(result.show, allCast[index]);
      gallery.appendChild(card);
    });

    setStatus("Showing " + topResults.length + " result for \"" + query + "\".");
  } catch (error) {
    console.error("Error fetching shows:", error);
    setStatus("Please try again.");
  }
}

/**
 * Handle the form submission.
 * @param {Event} event: Submit event.
 */
function handleSubmit(event) {
  event.preventDefault();
  const query = input.value;
  searchShows(query);
}

// Attach the event listener
form.addEventListener("submit", handleSubmit);

// Default search on page load
searchShows(DEFAULT_QUERY);