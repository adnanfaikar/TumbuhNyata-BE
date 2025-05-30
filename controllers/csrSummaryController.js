const CsrSubmission = require('../models/CsrSubmission');

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(angka);
};

const getCsrSummary = async (req, res) => {
  try {
    const submissions = await CsrSubmission.findAll();

    let totalDana = 0;
    let categoryMap = {}; // { [category]: { jumlah, total } }
    let statusMap = {
      selesai: 0,
      progress: 0,
      mendatang: 0
    };

    submissions.forEach(submission => {
      const budget = Number(submission.budget) || 0;
      const category = submission.category;
      const status = submission.status;

      // Total keseluruhan
      totalDana += budget;

      // Per kategori
      if (!categoryMap[category]) {
        categoryMap[category] = { jumlah: 0, total: 0 };
      }
      categoryMap[category].jumlah += 1;
      categoryMap[category].total += budget;

      // Per status
      if (status === 'selesai') {
        statusMap.selesai += budget;
      } else if (status === 'progress') {
        statusMap.progress += budget;
      } else {
        statusMap.mendatang += budget;
      }
    });

    // Hitung persentase
    Object.keys(categoryMap).forEach(category => {
      const cat = categoryMap[category];
      cat.persentase = ((cat.total / totalDana) * 100).toFixed(1);
    });

    res.json({
      totalDana: formatRupiah(totalDana),
      kategori: Object.entries(categoryMap).reduce((acc, [key, val]) => {
        acc[key] = {
          jumlah: val.jumlah,
          total: formatRupiah(val.total),
          persentase: val.persentase + "%"
        };
        return acc;
      }, {}),
      status: {
        selesai: formatRupiah(statusMap.selesai),
        progress: formatRupiah(statusMap.progress),
        mendatang: formatRupiah(statusMap.mendatang)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil summary CSR" });
  }
};

module.exports = { getCsrSummary };
