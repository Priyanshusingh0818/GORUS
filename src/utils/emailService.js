export const sendEmail = async (formData) => {
  const { name, email, phone, message } = formData;
  
  const mailtoLink = `mailto:Gorusorganics@gmail.com?subject=Contact Query from ${name}&body=Name: ${name}%0D%0AEmail: ${email}%0D%0APhone: ${phone}%0D%0A%0D%0AMessage:%0D%0A${message}`;
  
  window.location.href = mailtoLink;
  
  return { success: true };
};