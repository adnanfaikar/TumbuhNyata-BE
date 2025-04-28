# Dokumentasi API Notifikasi

API notifikasi ini dibuat untuk mengelola notifikasi pengguna dalam aplikasi TumbuhNyata.

## Persiapan Database

Sebelum menggunakan API, buat tabel notifikasi di database MySQL dengan menjalankan query yang ada di file `config/notification_schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);
```

## Endpoints API

### 1. Mendapatkan Notifikasi Pengguna

- **Endpoint:** `GET /notifications/:userId`
- **Deskripsi:** Mengambil semua notifikasi untuk pengguna tertentu
- **Parameter URL:** 
  - `userId` - ID pengguna yang ingin diambil notifikasinya
- **Response:** 
  ```json
  [
    {
      "id": 1,
      "user_id": "user123",
      "title": "Selamat Datang!",
      "message": "Terima kasih telah bergabung!",
      "is_read": false,
      "created_at": "2023-04-27T10:00:00Z"
    },
    ...
  ]
  ```

### 2. Membuat Notifikasi Baru

- **Endpoint:** `POST /notifications`
- **Deskripsi:** Membuat notifikasi baru
- **Body Request:**
  ```json
  {
    "user_id": "user123",
    "title": "Selamat Datang!",
    "message": "Terima kasih telah bergabung!"
  }
  ```
- **Response:** 
  ```json
  {
    "id": 1,
    "user_id": "user123",
    "title": "Selamat Datang!",
    "message": "Terima kasih telah bergabung!",
    "is_read": false,
    "created_at": "2023-04-27T10:00:00Z"
  }
  ```

### 3. Menandai Notifikasi sebagai Dibaca

- **Endpoint:** `PATCH /notifications/:id/read`
- **Deskripsi:** Menandai notifikasi sebagai telah dibaca
- **Parameter URL:** 
  - `id` - ID notifikasi yang ingin ditandai telah dibaca
- **Response:** 
  ```json
  {
    "message": "Notifikasi berhasil ditandai telah dibaca"
  }
  ```

### 4. Menghapus Notifikasi

- **Endpoint:** `DELETE /notifications/:id`
- **Deskripsi:** Menghapus notifikasi
- **Parameter URL:** 
  - `id` - ID notifikasi yang ingin dihapus
- **Response:** 
  ```json
  {
    "message": "Notifikasi berhasil dihapus"
  }
  ```

## Contoh Penggunaan API dari Android

Berikut contoh kode Kotlin untuk mengintegrasikan API notifikasi ini dengan aplikasi Android:

```kotlin
// Model Notifikasi
data class Notification(
    val id: Int,
    val user_id: String,
    val title: String,
    val message: String,
    val is_read: Boolean,
    val created_at: String
)

// Interface API dengan Retrofit
interface NotificationApi {
    @GET("notifications/{userId}")
    suspend fun getNotifications(@Path("userId") userId: String): List<Notification>
    
    @PATCH("notifications/{id}/read")
    suspend fun markAsRead(@Path("id") id: Int): Response<Any>
}

// Penggunaan dalam ViewModel
class NotificationViewModel(private val api: NotificationApi) : ViewModel() {
    private val _notifications = MutableLiveData<List<Notification>>()
    val notifications: LiveData<List<Notification>> = _notifications
    
    fun loadNotifications(userId: String) {
        viewModelScope.launch {
            try {
                val result = api.getNotifications(userId)
                _notifications.value = result
            } catch (e: Exception) {
                // Handle error
            }
        }
    }
    
    fun markAsRead(id: Int) {
        viewModelScope.launch {
            try {
                api.markAsRead(id)
                // Update local data
                _notifications.value = _notifications.value?.map {
                    if (it.id == id) it.copy(is_read = true) else it
                }
            } catch (e: Exception) {
                // Handle error
            }
        }
    }
}
``` 