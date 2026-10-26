document.addEventListener('DOMContentLoaded', () => {
  if (!API.checkAuth()) return;

  const user = API.getUser();
  if (user && user.name) {
    document.getElementById('user-display').textContent = user.name;
  }

  document.getElementById('btn-logout').addEventListener('click', () => {
    API.logout();
  });

  const habitForm = document.getElementById('habit-form');
  const habitIdInput = document.getElementById('habit-id');
  const habitNameInput = document.getElementById('habit-name');
  const habitTargetInput = document.getElementById('habit-target');
  const habitUnitInput = document.getElementById('habit-unit');
  const habitDescInput = document.getElementById('habit-desc');
  const numericFields = document.querySelectorAll('.field-numeric');
  const formTitle = document.getElementById('form-title');
  const btnSubmitHabit = document.getElementById('btn-submit-habit');
  const btnCancelEdit = document.getElementById('btn-cancel-edit');
  const habitGrid = document.getElementById('habit-grid');
  const habitLoading = document.getElementById('habit-list-loading');
  const habitEmpty = document.getElementById('habit-empty');
  const alertBox = document.getElementById('alert-box');

  let currentHabits = [];

  function showAlert(message, type = 'danger') {
    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = message;
    alertBox.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      alertBox.style.display = 'none';
    }, 4000);
  }

  // Tampilkan/sembunyikan input target & satuan sesuai tipe parameter
  function updateTypeFields() {
    const selectedType = document.querySelector('input[name="habit-type"]:checked').value;
    if (selectedType === 'boolean') {
      numericFields.forEach(el => el.style.display = 'none');
      habitTargetInput.required = false;
      habitUnitInput.required = false;
    } else {
      numericFields.forEach(el => el.style.display = 'block');
      habitTargetInput.required = true;
      habitUnitInput.required = true;
    }
  }

  document.querySelectorAll('input[name="habit-type"]').forEach(radio => {
    radio.addEventListener('change', updateTypeFields);
  });

  function resetForm() {
    habitIdInput.value = '';
    habitForm.reset();
    document.querySelector('input[name="habit-type"][value="numeric"]').checked = true;
    updateTypeFields();
    formTitle.textContent = 'Tambah Jenis Kebiasaan Baru';
    btnSubmitHabit.textContent = 'Simpan Kebiasaan';
    btnCancelEdit.style.display = 'none';
  }

  btnCancelEdit.addEventListener('click', resetForm);

  // Muat daftar habit
  async function loadHabits() {
    habitLoading.style.display = 'block';
    habitGrid.style.display = 'none';
    habitEmpty.style.display = 'none';

    try {
      const data = await API.request('/api/habits');
      currentHabits = data.habits || [];
      habitLoading.style.display = 'none';

      if (currentHabits.length === 0) {
        habitEmpty.style.display = 'block';
        return;
      }

      habitGrid.innerHTML = '';
      currentHabits.forEach(habit => {
        const item = document.createElement('div');
        item.className = 'habit-item';

        const isBoolean = habit.type === 'boolean';
        const badgeText = isBoolean 
          ? '🔘 Opsi Ya / Tidak' 
          : `🎯 Target: ${habit.target_value} ${escapeHTML(habit.unit)}`;

        const badgeColor = isBoolean ? '#fef3c7' : 'var(--primary-light)';
        const badgeTextColor = isBoolean ? '#92400e' : 'var(--primary)';

        item.innerHTML = `
          <div>
            <div class="habit-header">
              <span class="habit-title">${escapeHTML(habit.name)}</span>
              <span class="habit-target-badge" style="background: ${badgeColor}; color: ${badgeTextColor};">
                ${badgeText}
              </span>
            </div>
            <p style="font-size: 0.85rem; color: var(--gray-600); margin-top: 0.5rem;">
              ${escapeHTML(habit.description || 'Tidak ada catatan tambahan.')}
            </p>
          </div>
          <div class="habit-actions">
            <button class="btn btn-secondary btn-sm btn-edit" data-id="${habit.id}">✏️ Edit</button>
            <button class="btn btn-danger btn-sm btn-delete" data-id="${habit.id}">🗑️ Hapus</button>
            <a href="/tracker" class="btn btn-primary btn-sm" style="margin-left: auto;">Catat Harian →</a>
          </div>
        `;
        habitGrid.appendChild(item);
      });

      habitGrid.style.display = 'grid';

      // Event listeners tombol Edit & Hapus
      document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          const habit = currentHabits.find(h => h.id == id);
          if (habit) {
            habitIdInput.value = habit.id;
            habitNameInput.value = habit.name;

            const type = habit.type === 'boolean' ? 'boolean' : 'numeric';
            const radio = document.querySelector(`input[name="habit-type"][value="${type}"]`);
            if (radio) radio.checked = true;
            updateTypeFields();

            if (type === 'numeric') {
              habitTargetInput.value = habit.target_value;
              habitUnitInput.value = habit.unit;
            }

            habitDescInput.value = habit.description || '';
            formTitle.textContent = `Edit Kebiasaan: ${habit.name}`;
            btnSubmitHabit.textContent = 'Perbarui Kebiasaan';
            btnCancelEdit.style.display = 'inline-block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
      });

      document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.getAttribute('data-id');
          const habit = currentHabits.find(h => h.id == id);
          const confirmMsg = `Apakah Anda yakin ingin menghapus kebiasaan "${habit ? habit.name : ''}" beserta riwayat capaiannya?`;
          if (confirm(confirmMsg)) {
            try {
              await API.request(`/api/habits/${id}`, { method: 'DELETE' });
              showAlert('Kebiasaan berhasil dihapus', 'success');
              if (habitIdInput.value == id) resetForm();
              loadHabits();
            } catch (err) {
              showAlert(err.message || 'Gagal menghapus kebiasaan');
            }
          }
        });
      });

    } catch (err) {
      habitLoading.style.display = 'none';
      showAlert(err.message || 'Gagal memuat data kebiasaan');
    }
  }

  // Handle submit form tambah / edit
  habitForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = habitIdInput.value;
    const name = habitNameInput.value.trim();
    const type = document.querySelector('input[name="habit-type"]:checked').value;
    const description = habitDescInput.value.trim();

    const payload = {
      name,
      type,
      description,
    };

    if (type === 'boolean') {
      payload.target_value = 1;
      payload.unit = 'Ya/Tidak';
    } else {
      payload.target_value = parseFloat(habitTargetInput.value);
      payload.unit = habitUnitInput.value.trim();
    }

    try {
      if (id) {
        await API.request(`/api/habits/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showAlert('Kebiasaan berhasil diperbarui!', 'success');
      } else {
        await API.request('/api/habits', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showAlert('Kebiasaan baru berhasil ditambahkan!', 'success');
      }

      resetForm();
      loadHabits();
    } catch (err) {
      showAlert(err.message || 'Gagal menyimpan kebiasaan');
    }
  });

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  updateTypeFields();
  loadHabits();
});
