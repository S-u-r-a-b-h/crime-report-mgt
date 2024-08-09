 // Dynamically load the header content
 $(function() {
    $('#header-container').load('header.html');
});

$(document).ready(function() {
    // Function to load About Us content
    $('.aboutUs').click(function(event) {
        event.preventDefault(); // Prevent default link behavior
        loadContent('about-us.html');
    });

    // Function to load Contact Us content
    $('.contactUs').click(function(event) {
        event.preventDefault(); // Prevent default link behavior
        loadContent('contact-us.html');
    });

    // Function to load Crime List content
    $('.crimeList').click(function(event) {
        event.preventDefault(); // Prevent default link behavior
        loadContent('crime-list.html');
    });

    // Function to load content using AJAX
    function loadContent(url) {
        $.ajax({
            url: url,
            type: 'GET',
            success: function(response) {
                $('#contentArea').html(response); // Display content in content area
            },
            error: function(xhr, status, error) {
                console.error(xhr, status, error);
            }
        });
    }
});
document.getElementById('userType').addEventListener('change', function() {
    const selectedValue = this.value;

    if (selectedValue === 'user') {
        window.location.href = "user_login.html";
    } else if (selectedValue === 'police') {
        window.location.href = "police_login.html";
    } else if (selectedValue === 'register') {
        window.location.href = "user_registration.html";
    }
});



var index = 0;

function slideShow() {
    var images = document.querySelectorAll(".image");

    for (var i = 0; i < images.length; i++) {
        images[i].style.display = "none";
    }

    if (index >= images.length) {
        index = 0;
    }

    images[index].style.display = "block";
    index++;
}
setInterval(slideShow,3000)


async function fetchLiveNews() {
    const apiKey = '4ef6d75425be498a9378c45fd51c3d82';
    const apiUrl = 'https://newsapi.org/v2/top-headlines?country=us&apiKey=' + apiKey;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch news');
        }
        const data = await response.json();
        return data.articles || []; // Handle case where articles may be undefined
    } catch (error) {
        console.error('Error fetching live news:', error);
        return [];
    }
}

async function displayLiveNews() {
    const liveNewsContainer = document.getElementById('liveNewsContainer');

    try {
        const articles = await fetchLiveNews();
        articles.forEach(article => {
            const articleElement = document.createElement('div');
            articleElement.classList.add('live-news-article');
            articleElement.innerHTML = `
                <h3>${article.title}</h3>
                <p>${article.description}</p>
                <a href="${article.url}" target="_blank">Read more</a>
            `;
            liveNewsContainer.appendChild(articleElement);
        });
    } catch (error) {
        console.error('Error displaying live news:', error);
    }
}

displayLiveNews();

var map = L.map('map').setView([28.6139, 77.209], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

function checkComplaintType() {
    var complaintTypeSelect = document.getElementById("complaintType");
    var otherComplaintTypeDiv = document.getElementById("otherComplaintTypeDiv");
    var otherComplaintTypeInput = document.getElementById("otherComplaintType");

    if (complaintTypeSelect.value === "Other") {
      otherComplaintTypeDiv.style.display = "block";
      otherComplaintTypeInput.required = true;
    } else {
      otherComplaintTypeDiv.style.display = "none";
      otherComplaintTypeInput.required = false;
    }
  }
  