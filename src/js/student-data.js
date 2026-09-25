const STUDENT_DATA = [
    { absent: 1, name: 'Alexander Orvin Nathaniel', nickname: 'Orvin', avatar: '/img/people/1. Orvin.avif' },
    { absent: 2, name: 'Alfin Yusuf', nickname: 'Alfin', avatar: '/img/people/2. Alfin.avif' },
    { absent: 3, name: 'Alicia Rhensiana Kusuma', nickname: 'Ecy', avatar: '/img/people/3. Ecy.avif' },
    { absent: 4, name: 'Almaira Regina Anindinata', nickname: 'Almaira', avatar: '/img/people/4. Almaira.avif' },
    { absent: 5, name: 'Anak Agung Gede Chesta Adiwangsa', nickname: 'Chesta', avatar: '/img/people/5. Chesta.avif' },
    { absent: 6, name: 'Ardiany Putri', nickname: 'Dian', avatar: '/img/people/6. Dian.avif' },
    { absent: 7, name: 'Arvin Satria Ahnaf', nickname: 'Arvin', avatar: '/img/people/7. Arvin.avif' },
    { absent: 8, name: 'Aurelia Zahrayza Cempaka Unsulangie', nickname: 'Aurel', avatar: '/img/people/8. Aurel.avif' },
    { absent: 9, name: 'Bintang Ayu Sekar Wangi', nickname: 'Bintang', avatar: '/img/people/9. Bintang.avif' },
    { absent: 10, name: 'Bintang Maha Putra', nickname: 'Maha', avatar: '/img/people/10. Maha.avif' },
    { absent: 11, name: 'Dellarissa Barney Aldenia Karamoy', nickname: 'Della', avatar: '/img/people/11. Della.avif' },
    { absent: 12, name: 'Desak Made Naomi Putri Wirada', nickname: 'Naomi', avatar: '/img/people/12. Naomi.avif' },
    { absent: 13, name: 'Dito Prasetya', nickname: 'Dito', avatar: '/img/people/13. Dito.avif' },
    { absent: 14, name: 'I Dewa Ayu Intan Diah Andini', nickname: 'Intan', avatar: '/img/people/14. Intan.avif' },
    { absent: 15, name: 'I Gede Davindra Putra Prilian', nickname: 'Davin', avatar: '/img/people/15. Davin.avif' },
    { absent: 16, name: 'I Gede Prhyaterra Pratama Santana', nickname: 'Terra', avatar: '/img/people/16. Terra.avif' },
    { absent: 17, name: 'I Gusti Made Dandi Danendra', nickname: 'Dandi', avatar: '/img/people/17. Dandi.avif' },
    { absent: 18, name: 'I Gusti Ngurah Putu Deva Ananta', nickname: 'Deva', avatar: '/img/people/18. Deva.avif' },
    { absent: 19, name: 'I Kadek Saputra', nickname: 'Saputra', avatar: '/img/people/19. Saputra.avif' },
    { absent: 20, name: 'I Komang Raka Januarta Pande', nickname: 'Raka', avatar: '/img/people/20. Raka.avif' },
    { absent: 21, name: 'I Nyoman Manu Sudana', nickname: 'Manu', avatar: '/img/people/21. Manu.avif' },
    { absent: 22, name: 'I Nyoman Raditya Arya Agastya', nickname: 'Raditya', avatar: '/img/people/22. Raditya.avif' },
    { absent: 23, name: 'Kadek Jhordy Dwitya Saputra', nickname: 'Jhordy', avatar: '/img/people/23. Jhordy.avif' },
    { absent: 24, name: 'Komang Ray Maha Pranatha Jaya', nickname: 'Ray', avatar: '/img/people/24. Ray.avif' },
    { absent: 25, name: 'Komang Surya Galang Mahesa Putra', nickname: 'Galang', avatar: '/img/people/25. Galang.avif' },
    { absent: 26, name: 'Luh Putu Sintyawati', nickname: 'Sintya', avatar: '/img/people/26. Sintya.avif' },
    { absent: 27, name: 'Ni Kadek Dinda Maharani Primantara', nickname: 'Dinda Maharani', avatar: '/img/people/27. DindaMaharani.avif' },
    { absent: 28, name: 'Ni Kadek Satya Radharani', nickname: 'Satya', avatar: '/img/people/28. Satya.avif' },
    { absent: 29, name: 'Ni Komang Dinda Febriyanti', nickname: 'Dinda Febri', avatar: '/img/people/29. DindaFebriyanti.avif' },
    { absent: 30, name: 'Ni Made Melani Damayanti', nickname: 'Melani', avatar: '/img/people/30. Melani.avif' },
    { absent: 31, name: 'Ni Made Risma Kusuma Sari', nickname: 'Risma', avatar: '/img/people/31. Risma.avif' },
    { absent: 32, name: 'Ni Nyoman Ayu Indira Pradnya Kalista', nickname: 'Indira', avatar: '/img/people/32. Indira.avif' },
    { absent: 33, name: 'Ni Nyoman Widya Cahyani', nickname: 'Widya', avatar: '/img/people/33. Widya.avif' },
    { absent: 34, name: 'Ni Putu Anais Trisya Diantari', nickname: 'Anais', avatar: '/img/people/34. Anais.avif' },
    { absent: 35, name: 'Ni Putu Kirana Eka Putri', nickname: 'Kirana Eka', avatar: '/img/people/35. KiranaEka.avif' },
    { absent: 36, name: 'Ni Putu Regina Devi Yanti', nickname: 'Devik', avatar: '/img/people/36. Devik.avif' },
    { absent: 37, name: 'Ni Wayan Kirana Nariswari', nickname: 'Kirana Nariswari', avatar: '/img/people/37. KiranaNariswari.avif' }
];

export function renderStudents() {
    const grid = document.getElementById('studentGrid');
    if (!grid) {
        console.log('renderStudents: Students grid not found or data not available');
        return;
    } else {
        console.log('renderStudents: Students data loaded successful');
    }

    grid.innerHTML = STUDENT_DATA.map(student => `
        <article class="student-card" tabindex="0" data-student='${JSON.stringify(student)}'>
            <img class="student-avatar" src="${student.avatar || '/img/LevantraLogo.jpg'}" alt="${student.name}" />
            <h3>${student.name}</h3>
            <span class="absent-tag">No. ${String(student.absent).padStart(2, '0')}</span>
        </article>
    `).join('');

    grid.querySelectorAll('.student-card').forEach((card) => {
        const student = JSON.parse(card.dataset.student);
        card.addEventListener('click', () => openStudentModal(student));
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openStudentModal(student);
            }
        });
    });
}