/* For smooth scrolling and navigation bar*/
document.addEventListener("DOMContentLoaded", function () {
    const mainBody = document.querySelector(".main-body");
    const sections = document.querySelectorAll(".sect");
    const navLinks = document.querySelectorAll(".nav-item");

    // Create an Intersection Observer with .main-body as the root
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    // Get the ID of the visible section
                    const currentSection = entry.target.getAttribute("id");

                    // Update the active state of the navigation links
                    navLinks.forEach((link) => {
                        link.classList.remove("active");
                        if (link.getAttribute("href").includes(currentSection)) {
                            link.classList.add("active");
                        }
                    });
                }
            });
        },
        {
            root: mainBody,
            rootMargin: "0px",
            threshold: 0.5, 
        }
    );

    
    sections.forEach((section) => {
        observer.observe(section);
    });

    //Smooth scrolling
    navLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetId = link.getAttribute("href");
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                // Smoothly scroll to the target section
                targetSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start", // Align the top of the section with the top of the viewport
                });
            }
        });
    });
});