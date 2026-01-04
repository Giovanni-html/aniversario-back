const googleDrive = require('../storage/google-drive');
const { fotos } = require('../db');

/**
 * Upload a photo
 * Receives base64 image data, uploads to Google Drive, saves metadata to DB
 */
async function uploadFoto(req, res) {
  try {
    const { imageData, fileName, mimeType } = req.body;
    
    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'Imagem não fornecida'
      });
    }
    
    console.log(`📤 Recebendo upload: ${fileName || 'foto.jpg'}`);
    
    // Parse base64 data
    let buffer;
    let detectedMimeType = mimeType || 'image/jpeg';
    
    if (imageData.startsWith('data:')) {
      // Format: data:image/jpeg;base64,/9j/4AAQ...
      const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        detectedMimeType = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        return res.status(400).json({
          success: false,
          message: 'Formato de imagem inválido'
        });
      }
    } else {
      // Pure base64
      buffer = Buffer.from(imageData, 'base64');
    }
    
    const finalFileName = fileName || `foto_${Date.now()}.jpg`;
    
    console.log(`   Tamanho: ${(buffer.length / 1024).toFixed(1)} KB`);
    
    // Upload to Google Drive
    const driveFile = await googleDrive.uploadFile(buffer, finalFileName, detectedMimeType);
    
    // Save metadata to database
    const fotoSalva = await fotos.salvarFoto({
      google_drive_id: driveFile.id,
      url: driveFile.url,
      thumbnail_url: driveFile.thumbnailLink,
      nome_arquivo: driveFile.name,
      tamanho_bytes: driveFile.size,
    });
    
    console.log(`✅ Upload concluído: ${fotoSalva.nome_arquivo}`);
    
    return res.status(200).json({
      success: true,
      message: 'Foto enviada com sucesso!',
      foto: fotoSalva
    });
    
  } catch (error) {
    console.error('❌ Erro ao fazer upload:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erro ao enviar foto. Tente novamente.'
    });
  }
}

/**
 * List all photos with pagination
 */
async function listarFotos(req, res) {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 50;
    
    const listaFotos = await fotos.listarFotos(pagina, limite);
    const total = await fotos.contarFotos();
    
    return res.status(200).json({
      success: true,
      fotos: listaFotos,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite)
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar fotos:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar fotos'
    });
  }
}

/**
 * Delete a photo (admin only)
 */
async function deletarFoto(req, res) {
  try {
    const { id } = req.params;
    
    // Get photo from DB
    const foto = await fotos.buscarFotoPorId(id);
    
    if (!foto) {
      return res.status(404).json({
        success: false,
        message: 'Foto não encontrada'
      });
    }
    
    console.log(`🗑️ Deletando foto: ${foto.nome_arquivo}`);
    
    // Delete from Google Drive
    try {
      await googleDrive.deleteFile(foto.google_drive_id);
    } catch (driveError) {
      console.error('⚠️ Erro ao deletar do Drive (continuando):', driveError.message);
    }
    
    // Delete from database
    await fotos.deletarFoto(id);
    
    console.log(`✅ Foto deletada: ${foto.nome_arquivo}`);
    
    return res.status(200).json({
      success: true,
      message: 'Foto deletada com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao deletar foto:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erro ao deletar foto'
    });
  }
}

module.exports = {
  uploadFoto,
  listarFotos,
  deletarFoto,
};
