let slideIndex = 0;
showSlides();

function showSlides() {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  slideIndex++;
  if (slideIndex > slides.length) {
    slideIndex = 1;
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex - 1].style.display = "block";
  dots[slideIndex - 1].className += " active";
  setTimeout(showSlides, 6000); // Change image every 2 seconds
}

//<---------------------------------------------------------->
// window.onload = async () => {
//   let data = await getMemos();
//   let getUsernameRes = await fetch("/username");
//   let getUsernameResult = await getUsernameRes.json();

//   if (getUsernameResult.message == "success") {
//     document.querySelector(
//       ".Logout-button-area"
//     ).innerHTML = `<button id="Logout-button"> 登出  </button>`;

//     addLogoutEventListener();
//   }

//   let finalHTML = "";

//   for (let entry of data) {
//     finalHTML += `<div id="memos-${entry.id}">
//     <div class="memo" >
//     ${entry.description}
//     ${
//       getUsernameResult.message == "success"
//         ? `<div class="control-button-area">
//     <i class="fa-solid fa-trash-can" onclick="deleteMemo(${entry.id})" ></i>
//     <i class="fa-solid fa-pen-to-square" onclick="triggerEdit(${entry.id},'${entry.description}')" ></i>
//     </div>`
//         : ""
//     }
    
//     ${
//       entry.image
//         ? `<img class="uploadImage" src="/image/${entry.image}" />`
//         : ""
//     }
//       </div></div>`;
//   }
//   document.querySelector(".memo-area").innerHTML = finalHTML;
// };
